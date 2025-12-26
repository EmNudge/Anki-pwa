import { Database } from "sql.js";
import { executeQuery, executeQueryAll } from "~/utils/sql";
import protobuf from "protobufjs";
import deckConfigProto from "./deck_config.proto?raw";
import notesTypeProto from "./notestype.proto?raw";
import templatesProto from "./templates.proto?raw";
import fieldConfigProto from "./field.proto?raw";

type Anki21bDeckConfig = {
  answerAction: number;
  buryInterdayLearning: boolean;
  buryNew: boolean;
  buryReviews: boolean;
  capAnswerTimeToSecs: number;
  desiredRetention: number;
  disableAutoplay: boolean;
  easyDaysPercentages: number[];
  easyMultiplier: number;
  fsrsParams_4: unknown[];
  fsrsParams_5: unknown[];
  graduatingIntervalEasy: number;
  graduatingIntervalGood: number;
  hardMultiplier: number;
  historicalRetention: number;
  ignoreRevlogsBeforeDate: string;
  initialEase: number;
  interdayLearningMix: number;
  intervalMultiplier: number;
  lapseMultiplier: number;
  learnSteps: number[];
  leechAction: number;
  leechThreshold: number;
  maximumReviewInterval: number;
  minimumLapseInterval: number;
  newCardGatherPriority: number;
  newCardInsertOrder: number;
  newCardSortOrder: number;
  newMix: number;
  newPerDay: number;
  newPerDayMinimum: number;
  other: unknown[];
  paramSearch: string;
  questionAction: number;
  relearnSteps: number[];
  reviewOrder: number;
  reviewsPerDay: number;
  secondsToShowAnswer: number;
  secondsToShowQuestion: number;
  showTimer: boolean;
  skipQuestionWhenReplayingAnswer: boolean;
  stopTimerOnAnswer: boolean;
  waitForAudio: boolean;
};

export function getDeckConfig(db: Database) {
  const deckConfig = executeQuery<{
    config: Uint8Array;
    id: number;
    mtime_secs: number;
    name: string;
    usn: number;
  }>(db, "select * from deck_config");

  const { root } = protobuf.parse(deckConfigProto);
  const DeckConfig = root.lookupType("ConfigInDeckConfig");

  const deckConfigParsed = DeckConfig.decode(deckConfig.config) as unknown as Anki21bDeckConfig;

  return { ...deckConfig, config: deckConfigParsed };
}

export function getNotesType(db: Database) {
  /**
   * Maps an id to a css block and a latex pre/post note
   */
  const notesTypes = (() => {
    const notesTypes = executeQueryAll<{
      id: number;
      name: string;
      config: Uint8Array;
    }>(db, "SELECT cast(id as text) as id, name, config FROM notetypes");

    return notesTypes.map((notesType) => ({
      name: notesType.name,
      ...parseNotesTypeConfigProto(notesType.config),
    }));
  })();

  return notesTypes;
}

type Anki21bNotesTypeConfig = {
  css: string;
  kind: number;
  latexPost: string;
  latexPre: string;
  latexSvg: boolean;
  originalId: number | null;
  originalStockKind: number;
  other: unknown[];
  reqs: { fieldOrds: number[]; kind: number }[];
  sortFieldIdx: number;
  targetDeckIdUnused: number;
};

export function parseNotesTypeConfigProto(proto: Uint8Array) {
  const { root } = protobuf.parse(notesTypeProto);
  const NotesTypeConfig = root.lookupType("NotesTypeConfig");

  return NotesTypeConfig.toObject(NotesTypeConfig.decode(proto), {
    longs: String,
  }) as Anki21bNotesTypeConfig;
}

type Anki21bTemplate = {
  aFormat: string;
  id: number;
  qFormat: string;
};
export function parseTemplatesProto(proto: Uint8Array) {
  const { root } = protobuf.parse(templatesProto);
  const Template = root.lookupType("TemplateConfig");

  return Template.toObject(Template.decode(proto), {
    longs: String,
  }) as Anki21bTemplate;
}

type Anki21bFieldConfig = {
  sticky: boolean;
  rtl: boolean;
  fontName: string;
  fontSize: number;
  description: string;
  plainText: boolean;
  collapsed: boolean;
  excludeFromSearch: boolean;
  // used for merging notetypes on import (Anki 23.10)
  id?: number;
  // Can be used to uniquely identify required fields.
  tag?: number;
  preventDeletion: boolean;
  other: Uint8Array;
};
export function parseFieldConfigProto(proto: Uint8Array) {
  const { root } = protobuf.parse(fieldConfigProto);
  const FieldConfig = root.lookupType("FieldConfig");

  return FieldConfig.decode(proto) as unknown as Anki21bFieldConfig;
}
