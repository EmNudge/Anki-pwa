import {
  createMemo,
  createResource,
  createSignal,
} from "solid-js";
import { getAnkiDataFromBlob } from "./ankiParser";

export const [deckInfoSig, setDeckInfoSig] = createSignal<{
  name: string;
  cardCount: number;
  templateCount: number;
} | null>(null);

export const ankiCachePromise = caches.open("anki-cache");
export const [blobSig, setBlobSig] = createSignal<Blob | null>(null);

ankiCachePromise.then(async (cache) => {
  const response = await cache.match("anki-deck");
  if (!response) {
    return;
  }

  setBlobSig(await response.blob());
});


export const [ankiDataSig] = createResource(
  blobSig,
  (newBlob) => getAnkiDataFromBlob(newBlob),
);

export const [selectedCardSig, setSelectedCardSig] = createSignal(0);
export const cardsSig = createMemo(() => {
  setSelectedCardSig(0);
  return ankiDataSig()?.cards ?? []
});

export const [selectedTemplateSig, setSelectedTemplateSig] = createSignal(0);
export const templatesSig = createMemo(() => {
  setSelectedTemplateSig(0);
  return cardsSig()[selectedCardSig()]?.templates;
});

export const mediaFilesSig = createMemo(() =>
  ankiDataSig()?.files ?? new Map<string, string>()
);

export const [soundEffectsEnabledSig, setSoundEffectsEnabledSig] = createSignal(
  localStorage.getItem("soundEffectsEnabled") === "true"
);

export function toggleSoundEffects() {
  const newValue = !soundEffectsEnabledSig();
  setSoundEffectsEnabledSig(newValue);
  localStorage.setItem("soundEffectsEnabled", newValue.toString());
}
