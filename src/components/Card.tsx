import { JSX, onCleanup } from "solid-js";
import "solid-styled";
import { css } from "solid-styled";
import { playClickSoundBasic, playClickSoundMelodic } from "../utils/sound";

export type Answer = "again" | "hard" | "good" | "easy";

export function Card(props: {
  front: JSX.Element;
  back: JSX.Element;
  onChooseAnswer: (answer: Answer) => void;
  onReveal: () => void;
  activeSide: "front" | "back";
}) {
  // eslint-disable-next-line no-unused-expressions
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

      /* shrink width for smaller screens */
      width: 800px;

      min-height: 500px;
    }

    .card-content :global(img) {
      height: 200px;
      margin: 0 auto;
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
      flex-wrap: wrap;

      button {
        display: flex;
        gap: 0.5rem;

        .time {
          opacity: 0.5;
        }
      }
    }
  `;

  function handleKeyDown(e: KeyboardEvent) {
    if (props.activeSide === "front") {
      if (e.key === " ") {
        playClickSoundBasic();
        props.onReveal();
      }
      return;
    }

    if (e.key === "e") {
      playClickSoundMelodic();
      props.onChooseAnswer("easy");
    } else if (e.key === "h") {
      playClickSoundMelodic();
      props.onChooseAnswer("hard");
    } else if (e.key === "g") {
      playClickSoundMelodic();
      props.onChooseAnswer("good");
    } else if (e.key === "a") {
      playClickSoundMelodic();
      props.onChooseAnswer("again");
    }
  }

  document.addEventListener("keydown", handleKeyDown);
  onCleanup(() => {
    document.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div class="card">
      <div class="card-content">{props.activeSide === "front" ? props.front : props.back}</div>

      {props.activeSide === "front" ? (
        <button
          onClick={() => {
            playClickSoundBasic();
            props.onReveal();
          }}
        >
          Reveal
        </button>
      ) : (
        <div class="button-set">
          <button
            onClick={() => {
              playClickSoundMelodic();
              props.onChooseAnswer("again");
            }}
          >
            <span class="time">&lt;1m</span>
            <span class="answer">Again</span>
          </button>
          <button
            onClick={() => {
              playClickSoundMelodic();
              props.onChooseAnswer("hard");
            }}
          >
            <span class="time">&lt;6m</span>
            <span class="answer">Hard</span>
          </button>
          <button
            onClick={() => {
              playClickSoundMelodic();
              props.onChooseAnswer("good");
            }}
          >
            <span class="time">&lt;10m</span>
            <span class="answer">Good</span>
          </button>
          <button
            onClick={() => {
              playClickSoundMelodic();
              props.onChooseAnswer("easy");
            }}
          >
            <span class="time">&lt;5d</span>
            <span class="answer">Easy</span>
          </button>
        </div>
      )}
    </div>
  );
}
