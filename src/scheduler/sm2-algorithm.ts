import { Card as SM2Card, Scheduler } from "@open-spaced-repetition/sm-2";
import type { Answer } from "./types";
import type { SchedulingAlgorithm, SchedulingResult } from "./algorithm";
import { ANSWER_TO_RATING } from "./types";

/**
 * SM-2 algorithm adapter
 */
export class SM2Algorithm implements SchedulingAlgorithm {
  createCard(): unknown {
    const card = new SM2Card();
    return card.toJSON();
  }

  reviewCard(cardState: unknown, answer: Answer): SchedulingResult {
    const rating = ANSWER_TO_RATING[answer];
    const sm2Card = SM2Card.fromJSON(cardState as ReturnType<SM2Card["toJSON"]>);
    const result = Scheduler.reviewCard(sm2Card, rating);

    return {
      cardState: result.card.toJSON(),
      reviewLog: result.reviewLog.toJSON(),
    };
  }

  getNextIntervals(cardState: unknown): Record<Answer, Date> {
    const sm2Card = SM2Card.fromJSON(cardState as ReturnType<SM2Card["toJSON"]>);

    const intervals: Record<Answer, Date> = {} as Record<Answer, Date>;

    for (const answer of ["again", "hard", "good", "easy"] as Answer[]) {
      const rating = ANSWER_TO_RATING[answer];
      const result = Scheduler.reviewCard(sm2Card, rating);
      intervals[answer] = result.card.due;
    }

    return intervals;
  }

  getDueDate(cardState: unknown): Date {
    const sm2Card = SM2Card.fromJSON(cardState as ReturnType<SM2Card["toJSON"]>);
    return sm2Card.due;
  }

  getDisplayInfo(cardState: unknown): {
    ease?: number;
    interval?: number;
    repetitions?: number;
  } {
    const sm2Card = SM2Card.fromJSON(cardState as ReturnType<SM2Card["toJSON"]>);
    // SM2Card properties are: EF (ease factor), I (interval), n (repetitions)
    return {
      ease: sm2Card.EF,
      interval: sm2Card.I,
      repetitions: sm2Card.n,
    };
  }
}
