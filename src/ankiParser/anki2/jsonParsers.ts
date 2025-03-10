import { z } from "zod";

// The col table contains a JSON string for the conf, models, decks, and dconf fields

export const confSchema = z.object({
  activeDecks: z.array(z.number()),
  addToCur: z.boolean(),
  collapseTime: z.number(),
  creationOffset: z.number(),
  curDeck: z.number(),
  curModel: z.number(),
  dayLearnFirst: z.boolean(),
  dueCounts: z.boolean(),
  estTimes: z.boolean(),
  newSpread: z.number(),
  nextPos: z.number(),
  sched2021: z.boolean(),
  schedVer: z.number(),
  sortBackwards: z.boolean(),
  sortType: z.string(),
  timeLim: z.number()
});

export const modelSchema = z.record(z.object({
  id: z.number(),
  css: z.string(),
  latexPre: z.string(),
  latexPost: z.string(),
  flds: z.array(z.object({
    name: z.string(),
  })),
  tmpls: z.array(z.object({
    name: z.string(),
    afmt: z.string(),
    qfmt: z.string(),
    ord: z.number(),
    id: z.number().nullable().optional(),
  })),
}));

export const decksSchema = z.record(z.object({
  id: z.number(),
  mod: z.number(),
  name: z.string(),
  usn: z.number(),
  lrnToday: z.array(z.number()),
  revToday: z.array(z.number()),
  newToday: z.array(z.number()),
  timeToday: z.array(z.number()),
  collapsed: z.boolean(),
  browserCollapsed: z.boolean(),
  desc: z.string(),
  dyn: z.number(),
  conf: z.number(),
  extendNew: z.number(),
  extendRev: z.number(),
  reviewLimit: z.number().nullable(),
  newLimit: z.number().nullable(),
  reviewLimitToday: z.number().nullable(),
  newLimitToday: z.number().nullable()
}));

export const dconfSchema = z.record(z.object({
  id: z.number(),
  mod: z.number(),
  name: z.string(),
  usn: z.number(),
  maxTaken: z.number(),
  autoplay: z.boolean(),
  timer: z.number(),
  replayq: z.boolean(),
  new: z.object({
    bury: z.boolean(),
    delays: z.array(z.number()),
    initialFactor: z.number(),
    ints: z.array(z.number()),
    order: z.number(),
    perDay: z.number()
  }),
  rev: z.object({
    bury: z.boolean(),
    ease4: z.number(),
    ivlFct: z.number(),
    maxIvl: z.number(),
    perDay: z.number(),
    hardFactor: z.number()
  }),
  lapse: z.object({
    delays: z.array(z.number()),
    leechAction: z.number(),
    leechFails: z.number(),
    minInt: z.number(),
    mult: z.number()
  }),
  dyn: z.boolean(),
  newMix: z.number(),
  newPerDayMinimum: z.number(),
  interdayLearningMix: z.number(),
  reviewOrder: z.number(),
  newSortOrder: z.number(),
  newGatherPriority: z.number(),
  buryInterdayLearning: z.boolean(),
  fsrsWeights: z.array(z.number()),
  desiredRetention: z.number(),
  stopTimerOnAnswer: z.boolean(),
  secondsToShowQuestion: z.number(),
  secondsToShowAnswer: z.number(),
  answerAction: z.number(),
  waitForAudio: z.boolean(),
  sm2Retention: z.number(),
  weightSearch: z.string()
}));