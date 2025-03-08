import initSqlJs, { Database } from "sql.js";
import { assert } from "./utils/assert";
import { executeQueryAll } from "./utils/sql";
import wasm from "sql.js/dist/sql-wasm.wasm?url";
import { AnkiDb } from "./ankiParser/zip";
import {
  getNotesType,
  parseFieldConfigProto,
  parseTemplatesProto,
} from "./ankiParser/anki21b";

type AnkiData = {
  cards: {
    [k: string]: string;
  }[];
  templates: Template[];
  notesTypes: {
    name: string;
    css: string;
    latexPre: string;
    latexPost: string;
  }[] | null;
};

export async function getAnkiDbData(sqliteDbBlob: AnkiDb): Promise<AnkiData> {
  const SQL = await initSqlJs({ locateFile: () => wasm });

  const db = new SQL.Database(sqliteDbBlob.array);

  return sqliteDbBlob.type === "21b"
    ? getDataFromAnki21b(db)
    : getDataFromOldAnki(db);
}

function getDataFromAnki21b(db: Database): AnkiData {
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

function getDataFromOldAnki(db: Database): AnkiData {
  const model = (() => {
    const collectionData = db.exec("SELECT * FROM col")[0].values[0];

    const modelsJson = collectionData[9];
    assert(typeof modelsJson === "string", "Models JSON is not string");

    const models = JSON.parse(modelsJson as string) as Record<string, Model>;

    return Object.entries(models)[0][1];
  })();

  const fields = model.flds.map((field) => field.name);

  const notes = db.exec("SELECT * FROM notes")[0].values.map((note) =>
    note[6]!.toString().split("\x1F")
  );

  assert(
    fields.length === notes[0]!.length,
    "Fields and note data length mismatch",
  );

  const cards = notes.map((noteFields) =>
    Object.fromEntries(fields.map((field, index) => [field, noteFields[index]]))
  );

  return { cards, templates: model.tmpls, notesTypes: null };
}

export type Template = {
  afmt: string;
  qfmt: string;
  name: string;
};

type Model = {
  flds: { name: string }[];
  tmpls: Template[];
  ord: number;
};
