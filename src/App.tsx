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
  selectedTemplateSig,
  setBlobSig,
  setDeckInfoSig,
  setSchedulerSettingsModalOpenSig,
  setSelectedCardSig,
  templatesSig,
} from "./stores";
import { SRSVisualization } from "./components/SRSVisualization";
import { SchedulerSettingsModal } from "./components/SchedulerSettings";
import { CommandPalette } from "./components/CommandPalette";
import { DeckInfo } from "./components/DeckInfo";
import { useCommands } from "./ninjaKeys";

function App() {
  // eslint-disable-next-line no-unused-expressions
  css`
    main {
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
      // Count unique templates across all cards
      const uniqueTemplates = new Set(
        ankiData.cards.flatMap((card) => card.templates.map((template) => template.name)),
      );

      const deckInfo = {
        name: ankiData.deckName,
        cardCount: ankiData.cards.length,
        templateCount: uniqueTemplates.size,
      };
      setDeckInfoSig(deckInfo);
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
                    setActiveSide("back");
                    setReviewStartTime(Date.now());
                  }}
                  onChooseAnswer={async (answer: Answer) => {
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

                    setActiveSide("front");
                    setReviewStartTime(Date.now());
                  }}
                />
                <CardButtons
                  activeSide={activeSide()}
                  intervals={intervals()}
                  onReveal={() => {
                    setActiveSide("back");
                    setReviewStartTime(Date.now());
                  }}
                  onChooseAnswer={async (answer: Answer) => {
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

                    setActiveSide("front");
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
