import { Database } from "sql.js";
import { assert } from "~/utils/assert";
import { executeQuery, executeQueryAll } from "~/utils/sql";
import { z } from 'zod'

export function getDataFromAnki2(db: Database) {
  const model = (() => {
    const colData = executeQuery<{
      models: string;
      decks: string;
      dconf: string;
    }>(db, "SELECT * from col")

    const modelSchema = z.record(z.object({
      id: z.number(),
      css: z.string(),
      latexPre: z.string(),
      latexPost: z.string(),
      flds: z.array(z.object({
        name: z.string()
      })),
      tmpls: z.array(z.object({
        name: z.string(),
        afmt: z.string(),
        qfmt: z.string(),
        ord: z.number(),
        id: z.number().nullable()
      })),
    }));

    const models = modelSchema.parse(JSON.parse(colData.models));

    return Object.entries(models)[0][1];
  })();

  const fields = model.flds.map((field) => field.name);

  const notes = (() => {
    const notes = executeQueryAll<{ id: number; mid: number; flds: string }>(db, "SELECT id, mid, flds FROM notes")

    return notes.map((note) => note.flds.split("\x1F"))
  })()

  assert(
    fields.length === notes[0]!.length,
    "Fields and note data length mismatch",
  );

  const cards = notes.map((noteFields) =>
    Object.fromEntries(fields.map((field, index) => [field, noteFields[index]]))
  );

  return { cards, templates: model.tmpls, notesTypes: null };
}
