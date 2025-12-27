import { Show, For, createSignal, createEffect, onCleanup } from "solid-js";
import { css } from "solid-styled";
import { commandPaletteOpenSig, setCommandPaletteOpenSig, type Command } from "../commandPaletteStore";
import { FiSearch } from "solid-icons/fi";

export function CommandPalette(props: { commands: Command[] }) {
  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [breadcrumb, setBreadcrumb] = createSignal<string[]>([]);

  const [inputRef, setInputRef] = createSignal<HTMLInputElement | undefined>(undefined);

  // eslint-disable-next-line no-unused-expressions
  css`
    .command-palette-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--color-overlay);
      backdrop-filter: blur(8px);
      z-index: calc(var(--z-index-modal) + 100);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 20vh;
      animation: fadeIn var(--duration-fast) var(--ease-out);
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .command-palette {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      width: 640px;
      max-width: 90vw;
      max-height: 60vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideDown var(--duration-base) var(--ease-out);
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .command-palette-header {
      padding: var(--spacing-4);
      border-bottom: 1px solid var(--color-border);
    }

    .command-palette-breadcrumb {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      margin-bottom: var(--spacing-2);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-1);
    }

    .breadcrumb-separator {
      color: var(--color-text-tertiary);
    }

    .breadcrumb-back {
      background: none;
      border: none;
      color: var(--color-primary-500);
      cursor: pointer;
      padding: var(--spacing-1) var(--spacing-2);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-sm);
      transition: var(--transition-colors);
    }

    .breadcrumb-back:hover {
      background: var(--color-surface-elevated);
    }

    .command-palette-search {
      position: relative;
      display: flex;
      align-items: center;
    }

    .command-palette-search-icon {
      position: absolute;
      left: var(--spacing-3);
      color: var(--color-text-tertiary);
      pointer-events: none;
    }

    .command-palette-input {
      width: 100%;
      padding: var(--spacing-3) var(--spacing-3) var(--spacing-3) var(--spacing-10);
      border: none;
      background: transparent;
      color: var(--color-text-primary);
      font-size: var(--font-size-base);
      font-family: var(--font-family-sans);
      outline: none;
    }

    .command-palette-input::placeholder {
      color: var(--color-text-tertiary);
    }

    .command-palette-results {
      overflow-y: auto;
      max-height: 400px;
    }

    .command-palette-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-3) var(--spacing-4);
      cursor: pointer;
      border-left: 2px solid transparent;
      transition: var(--transition-colors);
    }

    .command-palette-item:hover {
      background: var(--color-neutral-100);
    }

    :root[data-theme="dark"] .command-palette-item:hover {
      background: var(--color-neutral-200);
    }

    .command-palette-item.selected {
      background: var(--color-neutral-200);
      border-left-color: var(--color-primary-500);
    }

    :root[data-theme="dark"] .command-palette-item.selected {
      background: var(--color-neutral-300);
      border-left-color: var(--color-primary-400);
    }

    .command-palette-item.selected .command-item-title {
      color: var(--color-text-primary);
      font-weight: var(--font-weight-semibold);
    }

    .command-item-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
      flex: 1;
    }

    .command-item-icon {
      color: var(--color-text-tertiary);
      font-size: var(--font-size-lg);
    }

    .command-item-title {
      color: var(--color-text-primary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
    }

    .command-item-title-highlight {
      background: var(--color-primary-100);
      color: var(--color-primary-700);
      font-weight: var(--font-weight-semibold);
      border-radius: var(--radius-xs);
      padding: 0 2px;
    }

    :root[data-theme="dark"] .command-item-title-highlight {
      background: var(--color-primary-900);
      color: var(--color-primary-300);
    }

    .command-item-hotkey {
      display: flex;
      gap: var(--spacing-1);
    }

    .command-item-kbd {
      padding: var(--spacing-1) var(--spacing-2);
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-xs);
      font-family: var(--font-family-mono);
      color: var(--color-text-secondary);
      min-width: 24px;
      text-align: center;
    }

    .command-item-arrow {
      color: var(--color-text-tertiary);
      font-size: var(--font-size-sm);
    }

    .command-palette-empty {
      padding: var(--spacing-8);
      text-align: center;
      color: var(--color-text-tertiary);
      font-size: var(--font-size-sm);
    }

    .command-palette-footer {
      padding: var(--spacing-2) var(--spacing-4);
      border-top: 1px solid var(--color-border);
      display: flex;
      gap: var(--spacing-4);
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);
    }

    .footer-hint {
      display: flex;
      align-items: center;
      gap: var(--spacing-1);
    }

    .footer-hint kbd {
      padding: var(--spacing-0-5) var(--spacing-1);
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-family: var(--font-family-mono);
      font-size: var(--font-size-xs);
    }
  `;

  // Get current parent commands
  const currentParent = () => breadcrumb()[breadcrumb().length - 1];

  // Filter commands based on search and parent
  const filteredCommands = () => {
    const commands = props.commands;
    console.log("filteredCommands called, commands:", commands);
    const query = searchQuery().toLowerCase();
    const parent = currentParent();

    return commands.filter((cmd) => {
      // Filter by parent
      if (parent) {
        if (cmd.parent !== parent) return false;
      } else {
        if (cmd.parent) return false;
      }

      // Filter by search query
      if (query && !cmd.title.toLowerCase().includes(query)) {
        return false;
      }

      return true;
    });
  };

  // Reset selection when filtered commands change
  createEffect(() => {
    filteredCommands();
    setSelectedIndex(0);
  });

  // Focus input when opened
  createEffect(() => {
    if (commandPaletteOpenSig()) {
      setTimeout(() => inputRef()?.focus(), 0);
      setSearchQuery("");
      setBreadcrumb([]);
      setSelectedIndex(0);
    }
  });

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    const commands = filteredCommands();

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, commands.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = commands[selectedIndex()];
      if (selected) {
        executeCommand(selected);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (breadcrumb().length > 0) {
        goBack();
      } else {
        closeCommandPalette();
      }
    } else if (e.key === "Backspace" && searchQuery() === "" && breadcrumb().length > 0) {
      e.preventDefault();
      goBack();
    }
  };

  const executeCommand = (cmd: Command) => {
    if (cmd.children && cmd.children.length > 0) {
      // Navigate into submenu
      setBreadcrumb([...breadcrumb(), cmd.id]);
      setSearchQuery("");
    } else if (cmd.handler) {
      // Execute handler
      const result = cmd.handler();
      if (!result?.keepOpen) {
        closeCommandPalette();
      }
    }
  };

  const goBack = () => {
    setBreadcrumb(breadcrumb().slice(0, -1));
    setSearchQuery("");
  };

  const closeCommandPalette = () => {
    setCommandPaletteOpenSig(false);
  };

  const matchesHotkey = (e: KeyboardEvent, hotkey: string): boolean => {
    const parts = hotkey.toLowerCase().split("+").map((s) => s.trim());
    const partSet = new Set(parts);
    const key =
      parts.find((p) => p !== "ctrl" && p !== "cmd" && p !== "meta" && p !== "shift" && p !== "alt") ??
      "";
    const needsCtrl = partSet.has("ctrl");
    const needsMeta = partSet.has("cmd") || partSet.has("meta");
    const needsShift = partSet.has("shift");
    const needsAlt = partSet.has("alt");

    return (
      (needsCtrl ? e.ctrlKey : !e.ctrlKey || needsMeta) &&
      (needsMeta ? e.metaKey : !e.metaKey || needsCtrl) &&
      (needsShift ? e.shiftKey : !e.shiftKey) &&
      (needsAlt ? e.altKey : !e.altKey) &&
      e.key.toLowerCase() === key
    );
  };

  // Open palette with Cmd/Ctrl + K
  createEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpenSig(true);
      }
    };
    window.addEventListener("keydown", onKeydown);
    onCleanup(() => window.removeEventListener("keydown", onKeydown));
  });

  // Global hotkeys for commands based on props.commands
  createEffect(() => {
    const keydownListener = (e: KeyboardEvent) => {
      // Don't trigger if command palette is open or if user is typing
      if (
        commandPaletteOpenSig() ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const commands = props.commands;
      for (const cmd of commands) {
        if (cmd.hotkey && matchesHotkey(e, cmd.hotkey)) {
          e.preventDefault();
          cmd.handler?.();
          break;
        }
      }
    };

    window.addEventListener("keydown", keydownListener);
    onCleanup(() => window.removeEventListener("keydown", keydownListener));
  });

  const renderHotkey = (hotkey?: string) => {
    if (!hotkey) return null;
    const keys = hotkey.split("+").map((k) => k.trim());
    return (
      <div class="command-item-hotkey">
        <For each={keys}>
          {(key) => <kbd class="command-item-kbd">{key}</kbd>}
        </For>
      </div>
    );
  };

  const highlightMatch = (title: string, query: string) => {
    if (!query) return title;

    const lowerTitle = title.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerTitle.indexOf(lowerQuery);

    if (index === -1) return title;

    const before = title.slice(0, index);
    const match = title.slice(index, index + query.length);
    const after = title.slice(index + query.length);

    return (
      <>
        {before}
        <span class="command-item-title-highlight">{match}</span>
        {after}
      </>
    );
  };

  return (
    <Show when={commandPaletteOpenSig()}>
      <div class="command-palette-overlay" onClick={closeCommandPalette}>
        <div class="command-palette" onClick={(e) => e.stopPropagation()}>
          <div class="command-palette-header">
            <Show when={breadcrumb().length > 0}>
              <div class="command-palette-breadcrumb">
                <button class="breadcrumb-back" onClick={goBack}>
                  ← Back
                </button>
                <For each={breadcrumb()}>
                  {(item, index) => (
                    <>
                      <Show when={index() > 0}>
                        <span class="breadcrumb-separator">/</span>
                      </Show>
                      <span class="breadcrumb-item">{item}</span>
                    </>
                  )}
                </For>
              </div>
            </Show>
            <div class="command-palette-search">
              <span class="command-palette-search-icon"><FiSearch /></span>
              <input
                ref={setInputRef}
                class="command-palette-input"
                type="text"
                placeholder="Type a command or search..."
                value={searchQuery()}
                onInput={(e) => setSearchQuery(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          <div class="command-palette-results">
            <Show when={filteredCommands().length > 0} fallback={
              <div class="command-palette-empty">
                No commands found
              </div>
            }>
              <For each={filteredCommands()}>
                {(cmd, index) => (
                  <div
                    class={`command-palette-item ${index() === selectedIndex() ? "selected" : ""}`}
                    onClick={() => executeCommand(cmd)}
                    onMouseEnter={() => setSelectedIndex(index())}
                  >
                    <div class="command-item-content">
                      <Show when={cmd.icon}>
                        <span class="command-item-icon">{cmd.icon}</span>
                      </Show>
                      <span class="command-item-title">{highlightMatch(cmd.title, searchQuery())}</span>
                    </div>
                    <Show when={cmd.children && cmd.children.length > 0}>
                      <span class="command-item-arrow">→</span>
                    </Show>
                    <Show when={!cmd.children && cmd.hotkey && !currentParent()}>
                      {renderHotkey(cmd.hotkey)}
                    </Show>
                  </div>
                )}
              </For>
            </Show>
          </div>

          <div class="command-palette-footer">
            <div class="footer-hint">
              <kbd>↑↓</kbd> Navigate
            </div>
            <div class="footer-hint">
              <kbd>Enter</kbd> Select
            </div>
            <div class="footer-hint">
              <kbd>Esc</kbd> Close
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}
