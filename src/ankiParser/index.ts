import { getAnkiDbData } from "../ankiModel";
import { getAnkiDataFromZip } from "./zip";

export async function getAnkiDataFromBlob(file: Blob) {
  const { ankiDb, files } = await getAnkiDataFromZip(file);
  const { cards, templates } = await getAnkiDbData(ankiDb);

  return { cards, templates, files };
}

