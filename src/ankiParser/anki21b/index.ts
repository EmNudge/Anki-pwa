import { getNotesType } from "./proto";

import { Database } from "sql.js";
import { executeQueryAll } from "~/utils/sql";
import { parseFieldConfigProto, parseTemplatesProto } from "./proto";
import { assertTruthy } from "~/utils/assert";

export type AnkiDB21bData = {
  cards: {
    values: {
      [k: string]: string;
    };
    tags: string[];
    templates: {
      name: string;
      afmt: string;
      qfmt: string;
    }[];
  }[];
  notesTypes: ReturnType<typeof getNotesType>;
};

export function getDataFromAnki21b(db: Database): AnkiDB21bData {
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

  const templatesMap = (() => {
    const templates = executeQueryAll<{
      name: string;
      config: Uint8Array;
      ntid: string;
    }>(db, "SELECT name, config, cast(ntid as text) as ntid FROM templates");

    const templatesMap = new Map<string, { name: string; afmt: string; qfmt: string }[]>();

    for (const template of templates) {
      const templateProto = parseTemplatesProto(template.config);

      const { aFormat, qFormat } = templateProto;

      const curTemplate = { name: template.name, afmt: aFormat, qfmt: qFormat };
      templatesMap.set(template.ntid, [...(templatesMap.get(template.ntid) ?? []), curTemplate]);
    }

    return templatesMap;
  })();

  const cards = (() => {
    /**
     * Notes define content.
     * They have a flds "array" that has its keys as entries in the fields table.
     */
    const notes = executeQueryAll<{
      flds: string;
      tags: string;
      mid: string;
    }>(db, "SELECT flds, tags, cast(mid as text) as mid FROM notes");

    return notes.map((note) => {
      const fieldNames = fields
        .filter((field) => note.mid === field.ntid)
        .map((field) => field.name);

      const templates = templatesMap.get(note.mid);
      assertTruthy(templates, `Template for note ${note.mid} not found`);

      return {
        values: Object.fromEntries(
          note.flds.split("\x1F").map((value, i) => [fieldNames[i], value]),
        ),
        // anki21b only has one template per model?
        templates: templates,
        tags: [],
      };
    });
  })();

  const notesTypes = getNotesType(db);

  return { cards, notesTypes };
}
