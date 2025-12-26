import { BlobWriter, Entry, FileEntry, TextWriter } from "@zip-js/zip-js";
import { ZipReader } from "@zip-js/zip-js";
import { BlobReader } from "@zip-js/zip-js";
import { isTruthy } from "../utils/assert";
import { assertTruthy } from "../utils/assert";
import mime from "mime";
import { decompressZstd } from "../utils/zstd";

/**
 * Type guard to check if an Entry is a FileEntry (has getData method)
 */
function isFileEntry(entry: Entry): entry is FileEntry {
  return !entry.directory;
}

export async function getAnkiDataFromZip(file: Blob): Promise<{
  ankiDb: AnkiDb;
  files: Map<string, string>;
}> {
  const zipFileReader = new BlobReader(file);
  const zipReader = new ZipReader(zipFileReader);
  const entries = await zipReader.getEntries();

  const ankiDb = await getAnkiDbFromEntries(entries);

  const files = await getFilesFromEntries(entries);

  await zipReader.close();

  return { ankiDb, files };
}

// expensive operation, maybe lazy load?
async function getFilesFromEntries(entries: Entry[]): Promise<Map<string, string>> {
  const mediaFileEntry = entries.find((entry) => entry.filename === "media");
  assertTruthy(mediaFileEntry, "media file not found");

  if (!isFileEntry(mediaFileEntry)) {
    throw new Error("media entry is not a file");
  }

  const mediaFileText = await mediaFileEntry.getData(new TextWriter());

  const mediaFile = (() => {
    try {
      return JSON.parse(mediaFileText) as Record<number, string>;
      // eslint-disable-next-line no-unused-vars
    } catch (_e) {
      // Intentionally ignoring parse errors - return empty object on failure
      return {};
    }
  })();
  const mediaFileMap = new Map(Object.entries(mediaFile));

  const filePromises = entries
    .map((entry) => {
      const actualFilename = mediaFileMap.get(entry.filename);
      if (!actualFilename) {
        return null;
      }

      if (!isFileEntry(entry)) {
        throw new Error(`entry ${entry.filename} is not a file`);
      }

      return { entry, actualFilename };
    })
    .filter(isTruthy)
    .map(async ({ entry, actualFilename }) => {
      const blob = await entry.getData(new BlobWriter());

      return {
        data: new Blob([blob], {
          type: mime.getType(actualFilename) ?? "application/octet-stream",
        }),
        name: actualFilename,
      };
    });

  const files = await Promise.all(filePromises);

  return new Map(files.map((file) => [file.name, URL.createObjectURL(file.data)]));
}

type AnkiDb = { type: "21b" | "21" | "2"; array: Uint8Array };

async function getAnkiDbFromEntries(entries: Entry[]): Promise<AnkiDb> {
  const sqliteDbEntry = (() => {
    const fileMap = new Map(entries.map((entry) => [entry.filename, entry]));

    return (
      fileMap.get("collection.anki21b") ??
      fileMap.get("collection.anki21") ??
      fileMap.get("collection.anki2")
    );
  })();

  assertTruthy(sqliteDbEntry, "sqlite.db not found");

  if (!isFileEntry(sqliteDbEntry)) {
    throw new Error("sqlite.db entry is not a file");
  }

  const sqliteDbBlob = await sqliteDbEntry.getData(new BlobWriter());

  assertTruthy(sqliteDbBlob, "blob not parsed from data");

  const sqliteDbBlobByteArray = new Uint8Array(await sqliteDbBlob.arrayBuffer());

  if (sqliteDbEntry.filename === "collection.anki21b") {
    const array = await decompressZstd(sqliteDbBlobByteArray);
    return { type: "21b", array };
  }

  return {
    type: sqliteDbEntry.filename === "collection.anki21" ? "21" : "2",
    array: sqliteDbBlobByteArray,
  };
}
