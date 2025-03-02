import { createSignal, JSX } from "solid-js";
import "solid-styled";
import { css } from "solid-styled";

export function Card({
  front,
  back,
}: {
  front: JSX.Element;
  back: JSX.Element;
}) {
  const [activeSide, setActiveSide] = createSignal<"front" | "back">("front");

  css`
    .card {
      border: 1px solid #282828;
      background: #202020;
      box-shadow: -1px 2px 5px #171717;
      border-radius: 4px;

      display: grid;
      gap: 1rem;

      min-width: 500px;
      min-height: 300px;
    }

    .card-content {
      padding: 2rem 1rem;
    }

    h1 {
      margin: 0;
      font-weight: 400;
      color: #eee;
      font-size: 1.5rem;
    }
  `;

  return (
    <div class="card">
      <h1>{activeSide() === "front" ? "Front" : "Back"}</h1>

      <div class="card-content">{activeSide() === "front" ? front : back}</div>

      <button
        onClick={() =>
          setActiveSide(activeSide() === "front" ? "back" : "front")
        }
      >
        {activeSide() === "front" ? "Back" : "Front"}
      </button>
    </div>
  );
}
