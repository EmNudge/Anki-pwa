import {
  createMemo,
  createResource,
  createSignal,
} from "solid-js";
import { getAnkiDataFromBlob } from "./ankiParser";

export const ankiCachePromise = caches.open("anki-cache");
export const [blob, setBlob] = createSignal<Blob | null>(null);

ankiCachePromise.then(async (cache) => {
  const response = await cache.match("anki-deck");
  if (!response) {
    return;
  }

  setBlob(await response.blob());
});


const [ankiData] = createResource(
  blob,
  (newBlob) => {
    console.log("newBlob", newBlob);
    return getAnkiDataFromBlob(newBlob)
  },
);

export const [selectedCard, setSelectedCard] = createSignal(0);
export const cards = createMemo(() => {
  const cards = ankiData()?.cards ?? [];
  setSelectedCard(0);
  return cards
});

export const [selectedTemplate, setSelectedTemplate] = createSignal(0);
export const templates = createMemo(() => {
  const templates = ankiData()?.templates ?? [];
  setSelectedTemplate(0);
  return templates;
});

export const mediaFiles = createMemo(() =>
  ankiData()?.files ?? new Map<string, string>()
);
