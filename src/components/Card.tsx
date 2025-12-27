import { JSX, onCleanup } from "solid-js";
import "solid-styled";
import { css } from "solid-styled";
import { playClickSoundBasic, playClickSoundMelodic } from "../utils/sound";
import { Button } from "../design-system";

export type Answer = "again" | "hard" | "good" | "easy";

export function Card(props: {
  front: JSX.Element;
  back: JSX.Element;
  onChooseAnswer: (answer: Answer) => void;
  onReveal: () => void;
  activeSide: "front" | "back";
  intervals?: {
    again: string;
    hard: string;
    good: string;
    easy: string;
  };
}) {
  // eslint-disable-next-line no-unused-expressions
  css`
    .card {
      border: 2px solid var(--color-border);
      background: var(--color-surface);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      border-radius: var(--radius-lg);
      padding: 0;

      width: 500px;
      max-width: 100%;

      min-height: 500px;
      position: relative;
      overflow: hidden;
    }

    .card--front {
      border-top-color: var(--color-border);
    }

    .card--back {
      border-top-color: var(--color-border);
    }

    @media (max-width: 1200px) {
      .card {
        width: 800px;
      }
    }

    @media (max-width: 768px) {
      .card {
        width: 100%;
        min-height: 400px;
      }
    }

    .card-indicator {
      display: inline-block;
      padding: var(--spacing-1) var(--spacing-3);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      border-radius: 0 0 var(--radius-md) 0;
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0.3;
    }

    .card-indicator--front {
      background: var(--color-primary);
      color: white;
    }

    .card-indicator--back {
      background: var(--color-success);
      color: white;
    }

    .card-content {
      padding: var(--spacing-8) var(--spacing-4) var(--spacing-4);
    }

    .card-content :global(img) {
      height: 200px;
      margin: 0 auto;
    }

    .card-content :global(hr) {
      margin: var(--spacing-4) 0;
      opacity: 0.25;
    }

    h1 {
      margin: 0;
      font-weight: var(--font-weight-normal);
      font-size: var(--font-size-2xl);
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
    <div class={`card card--${props.activeSide}`}>
      <div class={`card-indicator card-indicator--${props.activeSide}`}>
        {props.activeSide === "front" ? "Front" : "Back"}
      </div>
      <div class="card-content">
        {props.activeSide === "front" ? props.front : props.back}
      </div>
    </div>
  );
}

export function CardButtons(props: {
  onChooseAnswer: (answer: Answer) => void;
  onReveal: () => void;
  activeSide: "front" | "back";
  intervals?: {
    again: string;
    hard: string;
    good: string;
    easy: string;
  };
}) {
  // eslint-disable-next-line no-unused-expressions
  css`
    .reveal-button {
      width: 500px;
      max-width: 100%;
    }

    @media (max-width: 1200px) {
      .reveal-button {
        width: 800px;
      }
    }

    @media (max-width: 768px) {
      .reveal-button {
        width: 100%;
      }
    }

    .button-set {
      display: flex;
      justify-content: center;
      gap: var(--spacing-4);
      flex-wrap: wrap;
      width: 500px;
      max-width: 100%;

      .time {
        opacity: 0.5;
      }
    }

    @media (max-width: 1200px) {
      .button-set {
        width: 800px;
      }
    }

    @media (max-width: 768px) {
      .button-set {
        width: 100%;
      }
    }
  `;

  return (
    <>
      {props.activeSide === "front" ? (
        <Button
          class="reveal-button"
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => {
            playClickSoundBasic();
            props.onReveal();
          }}
        >
          Reveal
        </Button>
      ) : (
        <div class="button-set">
          <Button
            variant="secondary"
            onClick={() => {
              playClickSoundMelodic();
              props.onChooseAnswer("again");
            }}
          >
            <span class="time">{props.intervals?.again ?? "<1m"}</span>
            <span class="answer">Again</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              playClickSoundMelodic();
              props.onChooseAnswer("hard");
            }}
          >
            <span class="time">{props.intervals?.hard ?? "<6m"}</span>
            <span class="answer">Hard</span>
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              playClickSoundMelodic();
              props.onChooseAnswer("good");
            }}
          >
            <span class="time">{props.intervals?.good ?? "<10m"}</span>
            <span class="answer">Good</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              playClickSoundMelodic();
              props.onChooseAnswer("easy");
            }}
          >
            <span class="time">{props.intervals?.easy ?? "<5d"}</span>
            <span class="answer">Easy</span>
          </Button>
        </div>
      )}
    </>
  );
}
