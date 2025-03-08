import "./App.css";
import { type Template } from "./ankiModel";
import { createMemo, createSignal } from "solid-js";
import { Card } from "./components/Card";
import { css } from "solid-styled";
import { getRenderedCardString } from "./utils/render";
import { FilePicker } from "./components/FilePicker";
import { getAnkiDataFromBlob } from "./ankiParser";

const ankiCachePromise = caches.open("anki-cache");

function App() {
  const [templates, setTemplates] = createSignal<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = createSignal<Template | null>(
    null
  );

  const [cards, setCards] = createSignal<{ [key: string]: string }[]>([]);
  const [selectedCard, setSelectedCard] = createSignal<number>(0);

  const [mediaFiles, setMediaFiles] = createSignal<Map<string, string>>(
    new Map()
  );

  ankiCachePromise.then(async (cache) => {
    const response = await cache.match("anki-deck");
    if (!response) {
      return;
    }

    setDataFromBlob(await response.blob());
  });

  async function setDataFromBlob(blob: Blob) {
    const { cards, templates, files } = await getAnkiDataFromBlob(blob);

    setTemplates(templates);
    setSelectedTemplate(templates[0]);
    setCards(cards);

    setMediaFiles(files);
  }

  css`
    main {
      display: grid;
      gap: 1rem;
    }

    .dropdowns {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
  `;

  const [activeSide, setActiveSide] = createSignal<"front" | "back">("front");

  const renderedCard = createMemo(() => {
    if (!selectedTemplate()) {
      return null;
    }
    const { qfmt, afmt } = selectedTemplate()!;
    const card = cards()[selectedCard()];

    if (!card) {
      return null;
    }

    const frontSideHtml = getRenderedCardString({
      templateString: qfmt,
      variables: { ...card },
      mediaFiles: mediaFiles(),
    });

    const backSideHtml = getRenderedCardString({
      templateString: afmt,
      // https://docs.ankiweb.net/templates/fields.html#special-fields
      variables: { ...card, FrontSide: frontSideHtml },
      mediaFiles: mediaFiles(),
    });

    return { frontSideHtml, backSideHtml };
  });

  return (
    <main>
      {templates().length && cards().length && (
        <div class="dropdowns">
          <select
            onChange={(e) =>
              setSelectedTemplate(templates()[Number(e.target.value)])
            }
            class="border border-gray-400 rounded-md p-2"
          >
            {templates().map((template, index) => (
              <option value={index} selected={template === selectedTemplate()}>
                {template.name}
              </option>
            ))}
          </select>

          <select
            onChange={(e) => setSelectedCard(Number(e.target.value))}
            class="border border-gray-400 rounded-md p-2"
          >
            {cards().map((_card, index) => (
              <option value={index} selected={index === selectedCard()}>
                Card {(index + 1).toString().padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>
      )}

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
                setSelectedCard((cardNum) => cardNum + 1);
                setActiveSide("front");
              }}
            />
          )
        })()}
      </div>

      <FilePicker
        onFileChange={async (file) => {
          const cache = await ankiCachePromise;
          await cache.put("anki-deck", new Response(file));

          await setDataFromBlob(file);
        }}
      />
    </main>
  );
}

export default App;
