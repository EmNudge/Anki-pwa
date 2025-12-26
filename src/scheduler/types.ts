import type { Card as SM2Card, ReviewLog } from "@open-spaced-repetition/sm-2";

/**
 * Answer types for review buttons
 */
export type Answer = "again" | "hard" | "good" | "easy";

/**
 * Maps Answer to SM-2 rating (0-5 scale)
 * - Again: 0 (complete blackout)
 * - Hard: 3 (correct but with serious difficulty)
 * - Good: 4 (correct with hesitation)
 * - Easy: 5 (perfect response)
 */
export const ANSWER_TO_RATING: Record<Answer, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

/**
 * Review state for a card, combining our card ID with SM-2 scheduling data
 */
export interface CardReviewState {
  /**
   * Unique identifier for this card (combination of note ID + template index)
   */
  cardId: string;

  /**
   * ID of the deck this card belongs to
   */
  deckId: string;

  /**
   * SM-2 card state (serializable)
   */
  sm2State: ReturnType<SM2Card["toJSON"]>;

  /**
   * Timestamp when this card was first created/seen
   */
  createdAt: number;

  /**
   * Timestamp when this card was last reviewed
   */
  lastReviewed: number | null;
}

/**
 * Settings for the scheduler
 */
export interface SchedulerSettings {
  /**
   * Maximum number of new cards to show per day
   */
  dailyNewLimit: number;

  /**
   * Maximum number of review cards to show per day
   */
  dailyReviewLimit: number;

  /**
   * Show cards ahead of schedule if daily reviews are complete
   */
  showAheadOfSchedule: boolean;
}

/**
 * Default scheduler settings
 */
export const DEFAULT_SCHEDULER_SETTINGS: SchedulerSettings = {
  dailyNewLimit: 20,
  dailyReviewLimit: 200,
  showAheadOfSchedule: false,
};

/**
 * Daily review statistics
 */
export interface DailyStats {
  /**
   * Date in YYYY-MM-DD format
   */
  date: string;

  /**
   * Number of new cards reviewed
   */
  newCount: number;

  /**
   * Number of review cards completed
   */
  reviewCount: number;

  /**
   * Total review time in milliseconds
   */
  totalTimeMs: number;
}

/**
 * Stored review log entry
 */
export interface StoredReviewLog {
  cardId: string;
  timestamp: number;
  rating: number;
  reviewLog: ReturnType<ReviewLog["toJSON"]>;
}
