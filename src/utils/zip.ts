import { BlobWriter, Entry, TextWriter } from "@zip-js/zip-js";
import { ZipReader } from "@zip-js/zip-js";
import { BlobReader } from "@zip-js/zip-js";
import { assert } from "./assert";
import { assertTruthy } from "./assert";

export async function getAnkiDataFromZip(file: File) {
  const zipFileReader = new BlobReader(file);
  const zipReader = new ZipReader(zipFileReader);
  const entries = await zipReader.getEntries();

  const sqliteDbBlob = await getAnkiDbFromEntries(entries);

  const files = await getFilesFromEntries(entries);

  await zipReader.close();

  return { sqliteDbBlob, files };
}

// expensive operation, maybe lazy load?
async function getFilesFromEntries(entries: Entry[]) {
  const mediaFileEntry = entries.find(entry => entry.filename === "media")
  assertTruthy(mediaFileEntry, "media file not found");

  const mediaFileText = await mediaFileEntry.getData!(new TextWriter());

  const mediaFile = JSON.parse(mediaFileText) as Record<number, string>;
  const mediaFileMap = new Map(Object.entries(mediaFile))

  return Promise.all(entries.filter(entry => mediaFileMap.has(entry.filename)).map(async entry => {
    assert("getData" in entry, "getData method not found");
    return { data: await entry.getData!(new BlobWriter()), name: mediaFileMap.get(entry.filename) }
  }))
}

async function getAnkiDbFromEntries(entries: Entry[]) {
  const sqliteDbEntry = (() => {
    const dbEntries = entries.filter((entry) =>
      entry.filename.split(".").at(-1)?.startsWith("anki")
    );

    // return "old" version first
    return (
      dbEntries.find((entry) => entry.filename === "collection.anki21") ??
        dbEntries.find((entry) => entry.filename === "collection.anki2")
    );
  })();

  assertTruthy(sqliteDbEntry, "sqlite.db not found");
  assert("getData" in sqliteDbEntry, "getData method not found");

  const sqliteDbBlob = await sqliteDbEntry.getData!(new BlobWriter());

  return sqliteDbBlob;
}
