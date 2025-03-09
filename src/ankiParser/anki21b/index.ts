import { getNotesType } from "./proto";

import { Database } from "sql.js";
import { executeQueryAll } from "~/utils/sql";
import { parseFieldConfigProto, parseTemplatesProto } from "./proto";

export function getDataFromAnki21b(db: Database) {
  /**
   * Fields define the font size and name for each side of a card.
   * Their key is a composite of ntid + ord and is identical to the ntid of one row in templates
   */
  const fields = (() => {
    const fields = executeQueryAll<{
      config: Uint8Array;
      name: string;
      ntid: string;
    }>(db, "SELECT name, config, cast(ntid as text) as ntid FROM fields");

    return fields.map((field) => ({
      ...field,
      config: parseFieldConfigProto(field.config),
    }));
  })();

  const cards = (() => {
    /**
     * Notes define content. 
     * They have a flds "array" that has its keys as entries in the fields table.
     */
    const notes = executeQueryAll<{
      flds: string;
      mid: string;
      tags: string;
    }>(
      db,
      "SELECT flds, tags, cast(mid as text) as mid FROM notes",
    );

    return notes.map((note) => {
      const fieldNames = fields.filter((field) => note.mid === field.ntid).map((field) => field.name)

      return Object.fromEntries(note.flds.split("\x1F").map((value, i) => [fieldNames[i], value]))
    });
  })();

  const templates = (() => {
    const templates = executeQueryAll<{
      name: string;
      config: Uint8Array;
      ntid: string;
    }>(db, "SELECT name, config, cast(ntid as text) as ntid FROM templates");

    return templates.map((template) => {
      const { aFormat, qFormat, id } = parseTemplatesProto(template.config);

      return {
        name: template.name,
        afmt: aFormat,
        qfmt: qFormat,
        id,
      };
    });
  })();

  const notesTypes = getNotesType(db);

  return { cards, templates, notesTypes };
}