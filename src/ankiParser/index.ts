import { getAnkiDataFromZip } from "./unzipAnki";
import initSqlJs from "sql.js";
import wasm from "sql.js/dist/sql-wasm.wasm?url";
import { getDataFromAnki21b } from "./anki21b";
import { getDataFromAnki2 } from "./anki2";

export async function getAnkiDataFromBlob(file: Blob) {
  const { ankiDb, files } = await getAnkiDataFromZip(file);

  const SQL = await initSqlJs({ locateFile: () => wasm })
  const db = new SQL.Database(ankiDb.array);

  if (ankiDb.type === "21b") {
    const { cards, templates } = getDataFromAnki21b(db);
    return { cards, templates, files };
  }

  const { cards, templates } = getDataFromAnki2(db);
  return { cards, templates, files };
}

