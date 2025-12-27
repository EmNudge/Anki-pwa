import "./App.css";
import { createEffect, createMemo, createSignal } from "solid-js";
import { Card, CardButtons } from "./components/Card";
import type { Answer } from "./components/Card";
import { css } from "solid-styled";
import { getRenderedCardString } from "./utils/render";
import { FilePicker } from "./components/FilePicker";
import {
  ankiCachePromise,
  ankiDataSig,
  cardsSig,
  currentReviewCardSig,
  deckInfoSig,
  initializeReviewQueue,
  mediaFilesSig,
  moveToNextReviewCard,
  reviewQueueSig,
  schedulerEnabledSig,
  schedulerSettingsModalOpenSig,
  selectedCardSig,
  selectedDeckIdSig,
  selectedTemplateSig,
  setBlobSig,
  setDeckInfoSig,
  setSchedulerSettingsModalOpenSig,
  setSelectedCardSig,
  setSelectedDeckIdSig,
  templatesSig,
  type SubDeckInfo,
} from "./stores";
import { SRSVisualization } from "./components/SRSVisualization";
import { SchedulerSettingsModal } from "./components/SchedulerSettings";
import { CommandPalette } from "./components/CommandPalette";
import { DeckInfo } from "./components/DeckInfo";
import { useCommands } from "./ninjaKeys";
import { BackgroundWebGL } from "./components/BackgroundWebGL";
import { backgroundFxEnabledSig } from "./stores";
import { triggerPositiveBurst } from "./utils/fxBus";
import { isTruthy } from "./utils/assert";

function App() {
  // eslint-disable-next-line no-unused-expressions
  css`
    main {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 300px 1fr 400px;
      gap: var(--spacing-4);
      align-items: start;
      max-width: 1400px;
      margin: 0 auto;
    }

    @media (max-width: 1200px) {
      main {
        grid-template-columns: 1fr;
        max-width: 800px;
      }
    }

    :global(hr) {
      margin: 1rem 0;
    }

    .layout-left-column {
      grid-column: 1;
      grid-row: 1;
    }

    .layout-center-column {
      grid-column: 2;
      grid-row: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-4);
    }

    .layout-right-column {
      grid-column: 3;
      grid-row: 1;
    }

    @media (max-width: 1200px) {
      .layout-left-column,
      .layout-center-column,
      .layout-right-column {
        grid-column: 1;
      }

      .layout-left-column {
        grid-row: 1;
      }
      .layout-center-column {
        grid-row: 2;
      }
      .layout-right-column {
        grid-row: 3;
      }
    }

    .dropdowns {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .keyboard-hint {
      text-align: right;
      display: inline-block;
      opacity: 0.5;
      grid-column: 1 / -1;
      margin-top: var(--spacing-4);

      button {
        padding: 0.5rem;
        border-radius: 0.25rem;
      }
    }
  `;

  const [activeSide, setActiveSide] = createSignal<"front" | "back">("front");
  const [reviewStartTime, setReviewStartTime] = createSignal<number>(Date.now());
  const commands = useCommands();

  // Automatically populate deck info when deck is loaded
  createEffect(() => {
    const ankiData = ankiDataSig();
    if (ankiData) {
      // Calculate stats for each subdeck
      const subdeckStats = new Map<string, { cardCount: number; templates: Set<string> }>();

      // Initialize all decks with zero counts
      Object.entries(ankiData.decks).forEach(([deckId]) => {
        subdeckStats.set(deckId, { cardCount: 0, templates: new Set() });
      });

      // Count cards and templates per deck
      ankiData.cards.forEach((card) => {
        // Find the deck ID for this card by matching the deckName
        const deckEntry = Object.entries(ankiData.decks).find(
          ([_, deck]) => deck.name === card.deckName,
        );

        if (deckEntry) {
          const [deckId] = deckEntry;
          const stats = subdeckStats.get(deckId);
          if (stats) {
            stats.cardCount++;
            card.templates.forEach((template) => stats.templates.add(template.name));
          }
        }
      });

      // Build subdeck info array
      const subdecks: SubDeckInfo[] = Object.entries(ankiData.decks)
        .map(([deckId, deck]) => {
          const stats = subdeckStats.get(deckId);
          return {
            id: deckId,
            name: deck.name,
            cardCount: stats?.cardCount ?? 0,
            templateCount: stats?.templates.size ?? 0,
          };
        })
        .filter((subdeck) => subdeck.cardCount > 0); // Only show decks with cards

      // Calculate totals
      const totalCardCount = ankiData.cards.length;
      const uniqueTemplates = new Set(
        ankiData.cards.flatMap((card) => card.templates.map((template) => template.name)),
      );

      // If the deck name is "Default", try to extract a better name from subdecks
      let displayName = ankiData.deckName;
      if (displayName === "Default" && subdecks.length > 0) {
        // Find common parent from subdeck names (before the first "::")
        const parentNames = subdecks
          .map((subdeck) => {
            const parts = subdeck.name.split("::");
            return parts.length > 1 ? parts[0] : null;
          })
          .filter((name): name is string => name !== null);

        // If all subdecks share a common parent, use that as the display name
        if (parentNames.length > 0 && parentNames.every((name) => name === parentNames[0])) {
          displayName = parentNames[0]!;
        }
      }

      const deckInfo = {
        name: displayName,
        cardCount: totalCardCount,
        templateCount: uniqueTemplates.size,
        subdecks,
      };
      setDeckInfoSig(deckInfo);

      // Set initial selected deck to the first subdeck if available
      if (subdecks.length > 0 && selectedDeckIdSig() === null) {
        setSelectedDeckIdSig(subdecks[0]!.id);
      }
    }
  });

  // Initialize review queue when cards are loaded and scheduler is enabled
  createEffect(() => {
    const cards = cardsSig();
    const templates = templatesSig();
    const schedulerEnabled = schedulerEnabledSig();

    if (cards.length > 0 && templates && templates.length > 0 && schedulerEnabled) {
      initializeReviewQueue();
    }
  });

  // Get current card based on mode
  const currentCardData = createMemo(() => {
    if (schedulerEnabledSig()) {
      const reviewCard = currentReviewCardSig();
      if (!reviewCard) return null;

      return {
        cardIndex: reviewCard.cardIndex,
        templateIndex: reviewCard.templateIndex,
        reviewCard,
      };
    }

    return {
      cardIndex: selectedCardSig(),
      templateIndex: selectedTemplateSig(),
      reviewCard: null,
    };
  });

  const renderedCard = createMemo(() => {
    const data = currentCardData();
    if (!data) return null;

    const template = cardsSig()[data.cardIndex]?.templates[data.templateIndex];
    const card = cardsSig()[data.cardIndex];

    if (!template || !card) {
      return null;
    }

    const frontSideHtml = getRenderedCardString({
      templateString: template.qfmt,
      variables: { ...card.values },
      mediaFiles: mediaFilesSig(),
    });

    const backSideHtml = getRenderedCardString({
      templateString: template.afmt,
      // https://docs.ankiweb.net/templates/fields.html#special-fields
      variables: { ...card.values, FrontSide: frontSideHtml },
      mediaFiles: mediaFilesSig(),
    });

    return { frontSideHtml, backSideHtml };
  });

  const updateActiveSide = (side: "front" | "back") => {
    setActiveSide(side);
    const card = renderedCard();
    if (!card) return;

    if (side === "front") {
      const audioFilenames = getAudioFilenames(card.frontSideHtml);
      console.log("playing audioFilenames", audioFilenames);
      for (const filename of audioFilenames) {
        new Audio(filename).play();
      }
    } else {
      const frontSideAudioFilenames = new Set(getAudioFilenames(card.frontSideHtml));
      const backSideAudioFilenames = new Set(getAudioFilenames(card.backSideHtml));
      const newAudioFilenames = backSideAudioFilenames.difference(frontSideAudioFilenames);

      for (const filename of newAudioFilenames) {
        new Audio(filename).play();
      }
    }

    function getAudioFilenames(html: string) {
      const allAudioContainers = new DOMParser()
        .parseFromString(html, "text/html")
        .querySelectorAll<HTMLAudioElement>(`div.audio-container[data-autoplay] audio`);

      return [...allAudioContainers].map((audio) => audio.src).filter(isTruthy);
    }
  };

  // Calculate intervals for scheduler mode
  const intervals = createMemo(() => {
    if (!schedulerEnabledSig()) return undefined;

    const reviewCard = currentReviewCardSig();
    const queue = reviewQueueSig();

    if (!reviewCard || !queue) return undefined;

    return queue.getNextIntervals(reviewCard);
  });

  console.log("App rendering, deckInfoSig:", deckInfoSig());

  return (
    <>
      {backgroundFxEnabledSig() && <BackgroundWebGL />}
      <main>
        {/* LEFT COLUMN: Deck Info */}
        <div class="layout-left-column">{deckInfoSig() && <DeckInfo />}</div>

        {/* CENTER COLUMN: Card */}
        <div class="layout-center-column">
          {(() => {
            const card = renderedCard();
            console.log("rendering card, card:", card);
            if (!card) {
              return cardsSig().length === 0 ? (
                <FilePicker
                  onFileChange={async (file) => {
                    const cache = await ankiCachePromise;
                    await cache.put("anki-deck", new Response(file));

                    setBlobSig(file);
                  }}
                />
              ) : null;
            }

            return (
              <>
                <Card
                  front={<div innerHTML={card.frontSideHtml} />}
                  back={<div innerHTML={card.backSideHtml} />}
                  activeSide={activeSide()}
                  intervals={intervals()}
                  onReveal={() => {
                    updateActiveSide("back");
                    setReviewStartTime(Date.now());
                  }}
                  onChooseAnswer={async (answer: Answer) => {
                    if (answer === "good" || answer === "easy") {
                      triggerPositiveBurst(answer);
                    }
                    if (schedulerEnabledSig()) {
                      // Scheduler mode: process review
                      const reviewCard = currentReviewCardSig();
                      const queue = reviewQueueSig();

                      if (reviewCard && queue) {
                        const reviewTimeMs = Date.now() - reviewStartTime();
                        await queue.processReview(reviewCard, answer, reviewTimeMs);
                        moveToNextReviewCard();
                      }
                    } else {
                      // Simple mode: just move to next card
                      setSelectedCardSig((prevCard) => prevCard + 1);
                    }

                    updateActiveSide("front");
                    setReviewStartTime(Date.now());
                  }}
                />
                <CardButtons
                  activeSide={activeSide()}
                  intervals={intervals()}
                  onReveal={() => {
                    updateActiveSide("back");
                    setReviewStartTime(Date.now());
                  }}
                  onChooseAnswer={async (answer: Answer) => {
                    if (answer === "good" || answer === "easy") {
                      triggerPositiveBurst(answer);
                    }
                    if (schedulerEnabledSig()) {
                      // Scheduler mode: process review
                      const reviewCard = currentReviewCardSig();
                      const queue = reviewQueueSig();

                      if (reviewCard && queue) {
                        const reviewTimeMs = Date.now() - reviewStartTime();
                        await queue.processReview(reviewCard, answer, reviewTimeMs);
                        moveToNextReviewCard();
                      }
                    } else {
                      // Simple mode: just move to next card
                      setSelectedCardSig((prevCard) => prevCard + 1);
                    }

                    updateActiveSide("front");
                    setReviewStartTime(Date.now());
                  }}
                />
              </>
            );
          })()}
        </div>

        {/* RIGHT COLUMN: SRS Visualization */}
        <div class="layout-right-column">{cardsSig().length > 0 && <SRSVisualization />}</div>
      </main>

      <SchedulerSettingsModal
        isOpen={schedulerSettingsModalOpenSig()}
        onClose={() => setSchedulerSettingsModalOpenSig(false)}
      />
      <CommandPalette commands={commands()} />
    </>
  );
}

export default App;
