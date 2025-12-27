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

// Global keyboard shortcut listener (Cmd/Ctrl + K)
if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setCommandPaletteOpenSig(true);
    }
  });
}

export { commandPaletteOpenSig, setCommandPaletteOpenSig };
