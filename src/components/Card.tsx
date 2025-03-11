import { JSX } from "solid-js";
import "solid-styled";
import { css } from "solid-styled";

export type Answer = "again" | "hard" | "good" | "easy";

export function Card(props: {
  front: JSX.Element;
  back: JSX.Element;
  onChooseAnswer: (answer: Answer) => void;
  onReveal: () => void;
  activeSide: "front" | "back";
}) {
  css`
    .card {
      border: 1px solid var(--border-color);
      background: var(--surface-color-01, yellow);
      box-shadow: var(--box-shadow);
      border-radius: 4px;

      display: grid;
      grid-template-rows: 1fr auto;
      justify-items: stretch;
      gap: 1rem;

      min-width: 600px;
      min-height: 300px;
    }

    .card-content :global(img) {
      height: 420px;
    }

    .card-content :global(hr) {
      margin: 1rem 0;
      opacity: 0.25;
    }

    h1 {
      margin: 0;
      font-weight: 400;
      font-size: 1.5rem;
    }

    .button-set {
      display: flex;
      justify-content: center;
      gap: 1rem;

      button {
        display: flex;
        gap: 0.5rem;

        .time {
          opacity: 0.5;
        }
      }
    }
  `;

  return (
    <div class="card">
      <div class="card-content">
        {props.activeSide === "front" ? props.front : props.back}
      </div>

      {props.activeSide === "front" ? (
        <button onClick={props.onReveal}> Reveal </button>
      ) : (
        <div class="button-set">
          <button onClick={() => props.onChooseAnswer("again")}>
            <span class="time">&lt;1m</span>
            <span class="answer">Again</span>
          </button>
          <button onClick={() => props.onChooseAnswer("hard")}>
            <span class="time">&lt;6m</span>
            <span class="answer">Hard</span>
          </button>
          <button onClick={() => props.onChooseAnswer("good")}>
            <span class="time">&lt;10m</span>
            <span class="answer">Good</span>
          </button>
          <button onClick={() => props.onChooseAnswer("easy")}>
            <span class="time">&lt;5d</span>
            <span class="answer">Easy</span>
          </button>
        </div>
      )}
    </div>
  );
}
