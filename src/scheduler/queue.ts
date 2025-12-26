import type { CardReviewState, Answer, SchedulerSettings, DailyStats } from "./types";
import { reviewDB } from "./db";
import type { SchedulingAlgorithm } from "./algorithm";
import { SM2Algorithm } from "./sm2-algorithm";
import { FSRSAlgorithm } from "./fsrs-algorithm";

/**
 * Represents a card ready for review, combining deck data with review state
 */
export interface ReviewCard {
  /**
   * Unique identifier
   */
  cardId: string;

  /**
   * Index in the original cards array
   */
  cardIndex: number;

  /**
   * Template index for this card
   */
  templateIndex: number;

  /**
   * Review state
   */
  reviewState: CardReviewState;

  /**
   * Whether this is a new card (never reviewed)
   */
  isNew: boolean;
}

/**
 * Manages the review queue and scheduling logic
 */
export class ReviewQueue {
  private deckId: string;
  private settings: SchedulerSettings;
  private todayStats: DailyStats;
  private algorithm: SchedulingAlgorithm;

  constructor(deckId: string, settings: SchedulerSettings) {
    this.deckId = deckId;
    this.settings = settings;
    this.todayStats = {
      date: this.getTodayString(),
      newCount: 0,
      reviewCount: 0,
      totalTimeMs: 0,
    };

    // Initialize the appropriate algorithm
    if (settings.algorithm === "fsrs") {
      this.algorithm = new FSRSAlgorithm(settings.fsrsParams);
    } else {
      this.algorithm = new SM2Algorithm();
    }
  }

  /**
   * Get today's date as YYYY-MM-DD
   */
  private getTodayString(): string {
    const today = new Date();
    return today.toISOString().split("T")[0]!;
  }

  /**
   * Initialize the queue by loading today's stats
   */
  async init(): Promise<void> {
    const stats = await reviewDB.getDailyStats(this.getTodayString());
    if (stats) {
      this.todayStats = stats;
    }
  }

  /**
   * Generate a unique card ID from card index and template index
   */
  private generateCardId(cardIndex: number, templateIndex: number): string {
    return `${this.deckId}:${cardIndex}:${templateIndex}`;
  }

  /**
   * Build the review queue from the deck's cards
   * @param totalCards Total number of cards in the deck
   * @param templatesPerCard Number of templates for each card (assumes all cards have same templates)
   */
  async buildQueue(totalCards: number, templatesPerCard: number): Promise<ReviewCard[]> {
    const queue: ReviewCard[] = [];

    // Get existing review states
    const existingStates = await reviewDB.getCardsForDeck(this.deckId);
    const stateMap = new Map<string, CardReviewState>(
      existingStates.map((state) => [state.cardId, state]),
    );

    const now = new Date();

    // Generate cards for all card/template combinations
    for (let cardIndex = 0; cardIndex < totalCards; cardIndex++) {
      for (let templateIndex = 0; templateIndex < templatesPerCard; templateIndex++) {
        const cardId = this.generateCardId(cardIndex, templateIndex);
        let reviewState = stateMap.get(cardId);
        let isNew = false;

        // Create new review state if it doesn't exist
        if (!reviewState) {
          const cardState = this.algorithm.createCard();
          reviewState = {
            cardId,
            deckId: this.deckId,
            algorithm: this.settings.algorithm,
            cardState,
            createdAt: now.getTime(),
            lastReviewed: null,
          };
          isNew = true;
        }

        queue.push({
          cardId,
          cardIndex,
          templateIndex,
          reviewState,
          isNew,
        });
      }
    }

    return queue;
  }

  /**
   * Filter and sort queue to get cards due for review
   */
  getDueCards(queue: ReviewCard[]): ReviewCard[] {
    const now = new Date();
    const dueCards: ReviewCard[] = [];

    let newCardsShown = this.todayStats.newCount;
    let reviewCardsShown = this.todayStats.reviewCount;

    for (const card of queue) {
      try {
        const dueDate = this.algorithm.getDueDate(card.reviewState.cardState);
        const isDue = dueDate <= now;

        if (card.isNew) {
          // New cards - respect daily limit
          if (newCardsShown < this.settings.dailyNewLimit) {
            dueCards.push(card);
            newCardsShown++;
          }
        } else if (isDue) {
          // Due review cards - respect daily limit
          if (reviewCardsShown < this.settings.dailyReviewLimit) {
            dueCards.push(card);
            reviewCardsShown++;
          }
        } else if (
          this.settings.showAheadOfSchedule &&
          reviewCardsShown >= this.settings.dailyReviewLimit
        ) {
          // Ahead of schedule reviews (if enabled and review limit reached)
          dueCards.push(card);
        }
      } catch (error) {
        console.error("Error processing card in queue:", error, card);
        // Skip cards that fail to parse
      }
    }

    // Sort: new cards first, then by due date
    return dueCards.sort((a, b) => {
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;

      try {
        const aDue = this.algorithm.getDueDate(a.reviewState.cardState).getTime();
        const bDue = this.algorithm.getDueDate(b.reviewState.cardState).getTime();
        return aDue - bDue;
      } catch (error) {
        console.error("Error sorting cards:", error);
        return 0;
      }
    });
  }

  /**
   * Process a review answer and update the card state
   */
  async processReview(
    reviewCard: ReviewCard,
    answer: Answer,
    reviewTimeMs: number,
  ): Promise<CardReviewState> {
    try {
      // Review the card using the selected algorithm
      const result = this.algorithm.reviewCard(reviewCard.reviewState.cardState, answer);

      // Update review state
      const updatedState: CardReviewState = {
        ...reviewCard.reviewState,
        cardState: result.cardState,
        lastReviewed: Date.now(),
      };

      // Save to database
      await reviewDB.saveCard(updatedState);

      // Save review log
      await reviewDB.saveReviewLog({
        cardId: reviewCard.cardId,
        timestamp: Date.now(),
        rating: answer, // Store the answer instead of rating
        reviewLog: result.reviewLog,
      });

      // Update daily stats
      if (reviewCard.isNew) {
        this.todayStats.newCount++;
      } else {
        this.todayStats.reviewCount++;
      }
      this.todayStats.totalTimeMs += reviewTimeMs;

      await reviewDB.saveDailyStats(this.todayStats);

      return updatedState;
    } catch (error) {
      console.error("Error processing review:", error, reviewCard);
      // Return current state on error
      return reviewCard.reviewState;
    }
  }

  /**
   * Get the next intervals for each answer type
   */
  getNextIntervals(reviewCard: ReviewCard): Record<Answer, string> {
    try {
      const nextIntervals = this.algorithm.getNextIntervals(reviewCard.reviewState.cardState);

      const intervals: Record<Answer, string> = {
        again: this.formatInterval(nextIntervals.again),
        hard: this.formatInterval(nextIntervals.hard),
        good: this.formatInterval(nextIntervals.good),
        easy: this.formatInterval(nextIntervals.easy),
      };

      return intervals;
    } catch (error) {
      console.error("Error calculating intervals:", error);
      return {
        again: "<1m",
        hard: "<6m",
        good: "<10m",
        easy: "<5d",
      };
    }
  }

  /**
   * Format a due date as a human-readable interval
   */
  private formatInterval(dueDate: Date): string {
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / 1000 / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return "<1m";
    }
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    }
    if (diffHours < 24) {
      return `${diffHours}h`;
    }
    if (diffDays < 30) {
      return `${diffDays}d`;
    }

    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo`;
  }

  /**
   * Get remaining daily limits
   */
  getRemainingLimits(): { newLeft: number; reviewsLeft: number } {
    return {
      newLeft: Math.max(0, this.settings.dailyNewLimit - this.todayStats.newCount),
      reviewsLeft: Math.max(0, this.settings.dailyReviewLimit - this.todayStats.reviewCount),
    };
  }

  /**
   * Update settings
   */
  updateSettings(settings: SchedulerSettings): void {
    const oldAlgorithm = this.settings.algorithm;
    this.settings = settings;

    // Recreate the algorithm if it changed
    if (settings.algorithm !== oldAlgorithm) {
      if (settings.algorithm === "fsrs") {
        this.algorithm = new FSRSAlgorithm(settings.fsrsParams);
      } else {
        this.algorithm = new SM2Algorithm();
      }
    }
  }

  /**
   * Get display info for a card (for UI visualization)
   */
  getCardDisplayInfo(reviewCard: ReviewCard): {
    ease?: number;
    interval?: number;
    repetitions?: number;
    stability?: number;
    difficulty?: number;
    [key: string]: number | string | undefined;
  } {
    try {
      return this.algorithm.getDisplayInfo(reviewCard.reviewState.cardState);
    } catch (error) {
      console.error("Error getting display info:", error);
      return {};
    }
  }
}
