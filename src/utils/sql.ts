import initSqlJs, { type Database } from "sql.js";
import wasm from "sql.js/dist/sql-wasm.wasm?url";
import { assert, assertTruthy } from "./assert";

export async function getAnkiDbData(sqliteDbBlob: Blob) {
  const SQL = await initSqlJs({ locateFile: () => wasm });

  const db = new SQL.Database(new Uint8Array(await sqliteDbBlob.arrayBuffer()));

  const notes = getNotes(db);
  const fields = getModel(db).flds.map((field) => field.name);

  assert(
    fields.length === notes[0]!.length,
    "Fields and note data length mismatch",
  );

  const cards = notes.map((noteFields) =>
    Object.fromEntries(fields.map((field, index) => [field, noteFields[index]]))
  );

  return { cards, templates: getModel(db).tmpls };
}

function getNotes(db: Database) {
  const notes = db.exec("SELECT * FROM notes")[0].values;
  return notes.map((note) => {
    assertTruthy(note[6], "Note data not found");
    return note[6]!.toString().split("\x1F");
  });
}

type Model = {
  flds: { name: string }[];
  tmpls: { afmt: string; qfmt: string; name: string }[];
  ord: number;
};

function getModel(db: Database) {
  const collectionData = db.exec("SELECT * FROM col")[0].values[0];

  const modelsJson = collectionData[9];
  assert(typeof modelsJson === "string", "Models JSON is not string");

  const models = JSON.parse(modelsJson as string) as Record<string, Model>;

  return Object.entries(models)[0][1];
}
