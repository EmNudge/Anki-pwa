import { BlobWriter, Entry, TextWriter } from "@zip-js/zip-js";
import { ZipReader } from "@zip-js/zip-js";
import { BlobReader } from "@zip-js/zip-js";
import { assert, isTruthy } from "./assert";
import { assertTruthy } from "./assert";
import mime from "mime";

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
async function getFilesFromEntries(
  entries: Entry[],
): Promise<Map<string, string>> {
  const mediaFileEntry = entries.find((entry) => entry.filename === "media");
  assertTruthy(mediaFileEntry, "media file not found");

  const mediaFileText = await mediaFileEntry.getData!(new TextWriter());

  const mediaFile = JSON.parse(mediaFileText) as Record<number, string>;
  const mediaFileMap = new Map(Object.entries(mediaFile));

  const filePromises = entries.map((entry) => {
    const actualFilename = mediaFileMap.get(entry.filename);
    if (!actualFilename) {
      return null;
    }

    assert("getData" in entry, "getData method not found");

    return { entry, actualFilename };
  }).filter(isTruthy).map(async ({ entry, actualFilename }) => {
    const blob = await entry.getData!(new BlobWriter());

    return {
      data: new Blob([blob], {
        type: mime.getType(actualFilename) ?? "application/octet-stream",
      }),
      name: actualFilename,
    };
  });

  const files = await Promise.all(filePromises);

  return new Map(
    files.map((file) => [file.name, URL.createObjectURL(file.data)]),
  );
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
