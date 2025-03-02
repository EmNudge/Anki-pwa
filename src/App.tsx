import "./App.css";
import { getAnkiDbData, Template } from "./utils/sql";
import { getAnkiDataFromZip } from "./utils/zip";
import { assertTruthy } from "./utils/assert";
import { createSignal } from "solid-js";
import { Card } from "./components/Card";
import { css } from "solid-styled";
import { getRenderedCardString } from "./utils/render";

function App() {
  const [templates, setTemplates] = createSignal<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = createSignal<number>(0);

  const [cards, setCards] = createSignal<{ [key: string]: string }[]>([]);
  const [selectedCard, setSelectedCard] = createSignal<number>(0);

  const [mediaFiles, setMediaFiles] = createSignal<Map<string, string>>(new Map());

  const handleFileChange = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];

    assertTruthy(file, "No file selected");

    const { sqliteDbBlob, files } = await getAnkiDataFromZip(file);
    const { cards, templates } = await getAnkiDbData(sqliteDbBlob);

    setTemplates(templates);
    setCards(cards);

    setMediaFiles(files);
  };

  css`
    .dropdowns {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    .controls {
      display: grid;
      gap: 1rem;
      margin: 1rem;
    }
  `;

  const [activeSide, setActiveSide] = createSignal<"front" | "back">("front");

  return (
    <>
      <div class="controls">
        <input type="file" id="upload" onChange={handleFileChange} />

        {templates().length && cards().length && (
          <div class="dropdowns">
            <select
              onChange={(e) => setSelectedTemplate(Number(e.target.value))}
            >
              {templates().map((template, index) => (
                <option value={index}>{template.name}</option>
              ))}
            </select>

            <select onChange={(e) => setSelectedCard(Number(e.target.value))}>
              {cards().map((_card, index) => (
                <option value={index}>
                  Card {(index + 1).toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        {templates()[selectedTemplate()] && cards()[selectedCard()] && (
          <Card
            front={
              <div
                innerHTML={getRenderedCardString({
                  templateString: templates()[selectedTemplate()].qfmt,
                  card: cards()[selectedCard()],
                  mediaFiles: mediaFiles(),
                })}
              />
            }
            back={
              <div
                innerHTML={getRenderedCardString({
                  templateString: templates()[selectedTemplate()].afmt,
                  card: cards()[selectedCard()],
                  mediaFiles: mediaFiles(),
                })}
              />
            }
            activeSide={activeSide()}
            onReveal={() => {
              setActiveSide("back");
            }}
            onChooseAnswer={(_answer) => {
              setSelectedCard((cardNum) => cardNum + 1);
              setActiveSide("front");
            }}
          />
        )}
      </div>
    </>
  );
}

export default App;
