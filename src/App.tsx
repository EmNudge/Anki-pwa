import "./App.css";
import { getAnkiDbData } from "./utils/sql";
import { getAnkiDataFromZip } from "./utils/zip";
import { assertTruthy } from "./utils/assert";

function App() {
  const handleFileChange = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];

    assertTruthy(file, "No file selected");

    const { sqliteDbBlob, files } = await getAnkiDataFromZip(file);
    const { cards, templates } = await getAnkiDbData(sqliteDbBlob);

    console.log(cards);

  };

  return (
    <>
      <h1>Anki Notes</h1>
      <input type="file" id="upload" onChange={handleFileChange} />
    </>
  );
}

export default App;
