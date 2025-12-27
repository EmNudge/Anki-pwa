import { createSignal } from "solid-js";
import type { JSX } from "solid-js";

export interface Command {
  id: string;
  title: string;
  icon?: JSX.Element;
  hotkey?: string;
  parent?: string;
  children?: string[];
  handler?: () => void | { keepOpen: boolean };
}

const [commandPaletteOpenSig, setCommandPaletteOpenSig] = createSignal(false);

export { commandPaletteOpenSig, setCommandPaletteOpenSig };
