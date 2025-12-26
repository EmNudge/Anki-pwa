import { createMemo, createResource, createSignal } from "solid-js";
import { getAnkiDataFromBlob } from "./ankiParser";
import { ReviewQueue, type ReviewCard } from "./scheduler/queue";
import { DEFAULT_SCHEDULER_SETTINGS, type SchedulerSettings } from "./scheduler/types";
import { reviewDB } from "./scheduler/db";

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

export const [ankiDataSig] = createResource(blobSig, (newBlob) => getAnkiDataFromBlob(newBlob));

export const [selectedCardSig, setSelectedCardSig] = createSignal(0);
export const cardsSig = createMemo(() => {
  setSelectedCardSig(0);
  return ankiDataSig()?.cards ?? [];
});

export const [selectedTemplateSig, setSelectedTemplateSig] = createSignal(0);
export const templatesSig = createMemo(() => {
  setSelectedTemplateSig(0);
  return cardsSig()[selectedCardSig()]?.templates;
});

export const mediaFilesSig = createMemo(() => ankiDataSig()?.files ?? new Map<string, string>());

export const [soundEffectsEnabledSig, setSoundEffectsEnabledSig] = createSignal(
  localStorage.getItem("soundEffectsEnabled") === "true",
);

export function toggleSoundEffects() {
  const newValue = !soundEffectsEnabledSig();
  setSoundEffectsEnabledSig(newValue);
  localStorage.setItem("soundEffectsEnabled", newValue.toString());
}

// Scheduler and review queue state
export const [schedulerEnabledSig, setSchedulerEnabledSig] = createSignal(
  localStorage.getItem("schedulerEnabled") === "true",
);

export function toggleScheduler() {
  const newValue = !schedulerEnabledSig();
  setSchedulerEnabledSig(newValue);
  localStorage.setItem("schedulerEnabled", newValue.toString());
  // Reset queue when toggling
  setReviewQueueSig(null);
  setDueCardsSig([]);
  setCurrentReviewCardSig(null);
}

export const [schedulerSettingsSig, setSchedulerSettingsSig] = createSignal<SchedulerSettings>(
  DEFAULT_SCHEDULER_SETTINGS,
);

export const [reviewQueueSig, setReviewQueueSig] = createSignal<ReviewQueue | null>(null);

export const [dueCardsSig, setDueCardsSig] = createSignal<ReviewCard[]>([]);

export const [currentReviewCardSig, setCurrentReviewCardSig] = createSignal<ReviewCard | null>(
  null,
);

export const [schedulerSettingsModalOpenSig, setSchedulerSettingsModalOpenSig] = createSignal(false);

/**
 * Initialize the review queue for the current deck
 */
export async function initializeReviewQueue() {
  const cards = cardsSig();
  const templates = templatesSig();

  if (cards.length === 0 || !templates || templates.length === 0) {
    return;
  }

  // Use a simple deck ID based on card count and first card hash
  const deckId = `deck-${cards.length}`;

  // Load settings from IndexedDB
  const settings = await reviewDB.getSettings(deckId);
  setSchedulerSettingsSig(settings);

  // Create review queue
  const queue = new ReviewQueue(deckId, settings);
  await queue.init();

  // Build the full queue
  const fullQueue = await queue.buildQueue(cards.length, templates.length);

  // Get cards due for review
  const dueCards = queue.getDueCards(fullQueue);

  setReviewQueueSig(queue);
  setDueCardsSig(dueCards);

  // Set first card as current
  if (dueCards.length > 0) {
    setCurrentReviewCardSig(dueCards[0] ?? null);
  } else {
    setCurrentReviewCardSig(null);
  }
}

/**
 * Move to the next card in the review queue
 */
export function moveToNextReviewCard() {
  const dueCards = dueCardsSig();
  const currentIndex = dueCards.findIndex((card) => card.cardId === currentReviewCardSig()?.cardId);

  if (currentIndex < dueCards.length - 1) {
    setCurrentReviewCardSig(dueCards[currentIndex + 1] ?? null);
  } else {
    // No more cards
    setCurrentReviewCardSig(null);
  }
}
