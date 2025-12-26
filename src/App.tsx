import "./App.css";
import { createEffect, createMemo, createSignal } from "solid-js";
import { Card } from "./components/Card";
import type { Answer } from "./components/Card";
import { css } from "solid-styled";
import { getRenderedCardString } from "./utils/render";
import { FilePicker } from "./components/FilePicker";
import {
  ankiCachePromise,
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
import { Modal } from "./components/Modal";
import { SRSVisualization } from "./components/SRSVisualization";
import { SchedulerSettingsModal } from "./components/SchedulerSettings";
import { CommandPalette } from "./components/CommandPalette";
import { setCommandPaletteOpenSig } from "./commandPaletteStore";
import { useCommands } from "./ninjaKeys";

function App() {
  // eslint-disable-next-line no-unused-expressions
  css`
    main {
      display: grid;
      gap: 1rem;
    }

    :global(hr) {
      margin: 1rem 0;
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

      button {
        padding: 0.5rem;
        border-radius: 0.25rem;
      }
    }
  `;

  const [activeSide, setActiveSide] = createSignal<"front" | "back">("front");
  const [reviewStartTime, setReviewStartTime] = createSignal<number>(Date.now());
  const commands = useCommands();

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
    <main>
      <Modal isOpen={!!deckInfoSig()} onClose={() => setDeckInfoSig(null)} title="Deck Info">
        <div>
          <h3>{deckInfoSig()?.name}</h3>
          <p>Card Count: {deckInfoSig()?.cardCount}</p>
          <p>Template Count: {deckInfoSig()?.templateCount}</p>
        </div>
      </Modal>

      <SchedulerSettingsModal
        isOpen={schedulerSettingsModalOpenSig()}
        onClose={() => setSchedulerSettingsModalOpenSig(false)}
      />

      {cardsSig().length > 0 && <SRSVisualization />}

      <div>
        {(() => {
          const card = renderedCard();
          if (!card) {
            return null;
          }

          return (
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
          );
        })()}
      </div>

      {cardsSig().length === 0 && (
        <FilePicker
          onFileChange={async (file) => {
            const cache = await ankiCachePromise;
            await cache.put("anki-deck", new Response(file));

            setBlobSig(file);
          }}
        />
      )}
      <div class="keyboard-hint">
        <button
          onClick={() => {
            setCommandPaletteOpenSig(true);
          }}
        >
          <kbd>Cmd</kbd> + <kbd>K</kbd>
        </button>
      </div>
      <CommandPalette commands={commands()} />
    </main>
  );
}

export default App;
