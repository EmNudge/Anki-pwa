import { createSignal } from "solid-js";
import type { JSX } from "solid-js";

export interface Command {
  id: string;
  title: string;
  icon?: JSX.Element;
  hotkey?: string;
  label?: string;
  children?: Command[];
  handler?: () => void | { keepOpen: boolean };
  metadata?: {
    label: string;
    value: string | JSX.Element;
  }[];
}

const [commandPaletteOpenSig, setCommandPaletteOpenSig] = createSignal(false);
const [commandPaletteInitialParentSig, setCommandPaletteInitialParentSig] = createSignal<
  string | null
>(null);

export function openCommandPalette(initialParent?: string) {
  setCommandPaletteInitialParentSig(initialParent ?? null);
  setCommandPaletteOpenSig(true);
}

export { commandPaletteOpenSig, setCommandPaletteOpenSig, commandPaletteInitialParentSig };
