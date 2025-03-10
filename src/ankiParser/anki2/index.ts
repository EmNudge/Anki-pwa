import { Database } from "sql.js";
import { executeQuery, executeQueryAll } from "~/utils/sql";
import { modelSchema } from "./jsonParsers";
import { z } from "zod";
import { assertTruthy } from "~/utils/assert";

export type AnkiDB2Data = {
  cards: {
    values: {
      [k: string]: string | null;
    };
    tags: string[];
    templates: z.infer<typeof modelSchema>[string]["tmpls"];
  }[];
  notesTypes: null;
}

export function getDataFromAnki2(db: Database): AnkiDB2Data {
  const models = (() => {
    // anki2 and anki21 only use the first row of the col table
    // models, decks, and dconf are JSON strings
    const colData = executeQuery<{
      conf: string;
      models: string;
      decks: string;
      dconf: string;
      tags: string;
    }>(db, "SELECT * from col");

    return modelSchema.parse(JSON.parse(colData.models));
  })();

  const cards = (() => {
    const notes = executeQueryAll<
      { id: number; modelId: string; tags: string; fields: string }
    >(db, "SELECT id, cast(mid as text) as modelId, tags, flds as fields FROM notes");

    return notes.map((note) => {
      const modelForCard = models[note.modelId]
      assertTruthy(modelForCard, `Model ${note.modelId} not found`)

      const keys = modelForCard.flds.map((fld) => fld.name)
      const values = note.fields.split("\x1F")
      const valuesMap = Object.fromEntries(keys.map((key, index) => [key, values[index] || null]))

      return ({
        values: valuesMap,
        tags: note.tags.split("\x1F"),
        templates: modelForCard.tmpls,
      })
    });
  })();

  return { cards, notesTypes: null };
}
