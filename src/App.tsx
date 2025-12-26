import "./App.css";
import { createMemo, createSignal } from "solid-js";
import { Card } from "./components/Card";
import { css } from "solid-styled";
import { getRenderedCardString } from "./utils/render";
import { FilePicker } from "./components/FilePicker";
import {
  ankiCachePromise,
  cardsSig,
  deckInfoSig,
  mediaFilesSig,
  selectedCardSig,
  selectedTemplateSig,
  setBlobSig,
  setDeckInfoSig,
  setSelectedCardSig,
  templatesSig,
} from "./stores";
import { Modal } from "./components/Modal";

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

  const renderedCard = createMemo(() => {
    const template = templatesSig()?.[selectedTemplateSig()];
    const card = cardsSig()[selectedCardSig()];

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
              onReveal={() => {
                setActiveSide("back");
              }}
              onChooseAnswer={(_answer) => {
                setSelectedCardSig((prevCard) => prevCard + 1);
                setActiveSide("front");
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
            const ninja = document.querySelector("ninja-keys");
            ninja?.open();
          }}
        >
          <kbd>Cmd</kbd> + <kbd>K</kbd>
        </button>
      </div>
    </main>
  );
}

export default App;
