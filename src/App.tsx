import "./App.css";
import { createMemo, createSignal } from "solid-js";
import { Card } from "./components/Card";
import { css } from "solid-styled";
import { getRenderedCardString } from "./utils/render";
import { FilePicker } from "./components/FilePicker";
import {
  ankiCachePromise,
  cards,
  mediaFiles,
  selectedCard,
  selectedTemplate,
  setBlob,
  setSelectedCard,
  templates,
} from "./stores";

function App() {
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
    const template = templates()[selectedTemplate()];
    const card = cards()[selectedCard()];

    if (!template || !card) {
      return null;
    }

    const frontSideHtml = getRenderedCardString({
      templateString: template.qfmt,
      variables: { ...card },
      mediaFiles: mediaFiles(),
    });

    const backSideHtml = getRenderedCardString({
      templateString: template.afmt,
      // https://docs.ankiweb.net/templates/fields.html#special-fields
      variables: { ...card, FrontSide: frontSideHtml },
      mediaFiles: mediaFiles(),
    });

    return { frontSideHtml, backSideHtml };
  });

  return (
    <main>
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
                setSelectedCard((prevCard) => prevCard + 1);
                setActiveSide("front");
              }}
            />
          );
        })()}
      </div>

      {cards().length === 0 && (
        <FilePicker
          onFileChange={async (file) => {
            const cache = await ankiCachePromise;
            await cache.put("anki-deck", new Response(file));

            setBlob(file);
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
