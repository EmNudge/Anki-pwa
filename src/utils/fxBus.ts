import { createSignal } from "solid-js";

type PositiveAnswer = "good" | "easy";

type FxEvent =
  | {
      type: "positive-burst";
      answer: PositiveAnswer;
      at: number;
      rect: { x: number; y: number; width: number; height: number } | null;
    };

const [fxEventSig, setFxEventSig] = createSignal<FxEvent | null>(null);

export const triggerPositiveBurst = (answer: PositiveAnswer) => {
  const cardEl = document.querySelector(".card") as HTMLElement | null;
  const rect = cardEl?.getBoundingClientRect() ?? null;
  const normalizedRect =
    rect === null
      ? null
      : {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        };

  setFxEventSig({
    type: "positive-burst",
    answer,
    at: performance.now() / 1000,
    rect: normalizedRect,
  });
};

export { fxEventSig };


