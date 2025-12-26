import { createSignal } from "solid-js";

export interface Command {
  id: string;
  title: string;
  icon?: string;
  hotkey?: string;
  parent?: string;
  children?: string[];
  handler?: () => void | { keepOpen: boolean };
}

const [commandPaletteOpenSig, setCommandPaletteOpenSig] = createSignal(false);
const [commandsSig, setCommandsSig] = createSignal<Command[]>([]);

// Global API for opening command palette
export const commandPaletteAPI = {
  open: (_options?: { parent?: string }) => {
    setCommandPaletteOpenSig(true);
    // TODO: If we need to support opening with a specific parent,
    // we can add that functionality here
  },
  close: () => {
    setCommandPaletteOpenSig(false);
  },
  setCommands: (commands: Command[]) => {
    console.log("setCommands called, commands:", commands);
    setCommandsSig(commands);
  },
};

// Global keyboard shortcut listener (Cmd/Ctrl + K)
if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      commandPaletteAPI.open();
    }
  });

  // Register global hotkeys for commands
  window.addEventListener("keydown", (e) => {
    // Don't trigger if command palette is open or if user is typing
    if (
      commandPaletteOpenSig() ||
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    const commands = commandsSig();
    for (const cmd of commands) {
      if (cmd.hotkey && matchesHotkey(e, cmd.hotkey)) {
        e.preventDefault();
        cmd.handler?.();
        break;
      }
    }
  });
}

function matchesHotkey(e: KeyboardEvent, hotkey: string): boolean {
  const parts = hotkey.toLowerCase().split("+").map((s) => s.trim());

  let needsCtrl = false;
  let needsMeta = false;
  let needsShift = false;
  let needsAlt = false;
  let key = "";

  for (const part of parts) {
    if (part === "ctrl") needsCtrl = true;
    else if (part === "cmd" || part === "meta") needsMeta = true;
    else if (part === "shift") needsShift = true;
    else if (part === "alt") needsAlt = true;
    else key = part;
  }

  return (
    (needsCtrl ? e.ctrlKey : !e.ctrlKey || needsMeta) &&
    (needsMeta ? e.metaKey : !e.metaKey || needsCtrl) &&
    (needsShift ? e.shiftKey : !e.shiftKey) &&
    (needsAlt ? e.altKey : !e.altKey) &&
    e.key.toLowerCase() === key
  );
}

export { commandPaletteOpenSig, setCommandPaletteOpenSig, commandsSig, setCommandsSig };
