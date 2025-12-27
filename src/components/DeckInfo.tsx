import { css } from "solid-styled";
import { Show, createMemo } from "solid-js";
import { deckInfoSig, selectedDeckIdSig, templatesSig, selectedTemplateSig } from "../stores";
import { SidePanel } from "../design-system/components/layout/SidePanel";
import { StatItem } from "../design-system/components/primitives/StatItem";
import { openCommandPalette } from "../commandPaletteStore";
import { FiChevronDown } from "solid-icons/fi";

export function DeckInfo() {
  // eslint-disable-next-line no-unused-expressions
  css`
    .deck-name {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      word-break: break-word;
      margin-bottom: var(--spacing-2);
    }

    .current-deck-section {
      margin-bottom: var(--spacing-4);
    }

    .current-deck-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-2);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .current-deck-display {
      padding: var(--spacing-3);
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-2);
    }

    .current-deck-name {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-1);
      word-break: break-word;
    }

    .current-deck-stats {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .change-deck-button {
      width: 100%;
      padding: var(--spacing-2) var(--spacing-3);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      cursor: pointer;
      color: var(--color-text-primary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      transition: var(--transition-colors);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-2);
    }

    .change-deck-button:hover {
      background: var(--color-surface-elevated);
      border-color: var(--color-border-hover);
    }

    .change-deck-button:active {
      transform: scale(0.98);
    }

    .change-deck-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    .stats-section {
      margin-top: var(--spacing-4);
      padding-top: var(--spacing-4);
      border-top: 1px solid var(--color-border-primary);
    }

    .stats-title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-3);
    }
  `;

  const deckInfo = () => deckInfoSig();

  // Get the currently selected subdeck info
  const selectedSubdeck = createMemo(() => {
    const info = deckInfo();
    const selectedId = selectedDeckIdSig();
    if (!info || !selectedId) return null;

    return info.subdecks.find((subdeck) => subdeck.id === selectedId) ?? null;
  });

  // Get the currently selected template
  const selectedTemplate = createMemo(() => {
    const templates = templatesSig();
    const selectedIndex = selectedTemplateSig();
    if (!templates || templates.length === 0) return null;

    return templates[selectedIndex];
  });

  // Get the total number of subdecks
  const deckCount = createMemo(() => {
    const info = deckInfo();
    return info?.subdecks.length ?? 0;
  });

  // Get the total number of templates
  const templateCount = createMemo(() => {
    const templates = templatesSig();
    return templates?.length ?? 0;
  });

  // Get the current deck name (either subdeck or "All Cards")
  const currentDeckName = createMemo(() => {
    const subdeck = selectedSubdeck();
    return subdeck?.name ?? "All Cards";
  });

  // Get the current card count
  const currentCardCount = createMemo(() => {
    const subdeck = selectedSubdeck();
    const info = deckInfo();
    return subdeck?.cardCount ?? info?.cardCount ?? 0;
  });

  // Get the current template count
  const currentTemplateCount = createMemo(() => {
    const subdeck = selectedSubdeck();
    const info = deckInfo();
    return subdeck?.templateCount ?? info?.templateCount ?? 0;
  });

  const handleChangeDeck = () => {
    openCommandPalette("switch-deck");
  };

  const handleChangeTemplate = () => {
    openCommandPalette("select-template");
  };

  return (
    <SidePanel title="Deck Info" maxWidth="300px">
      <h3 class="deck-name">{deckInfo()?.name}</h3>

      <Show when={deckInfo()?.subdecks && deckInfo()!.subdecks.length > 0}>
        <div class="current-deck-section">
          <div class="current-deck-label">Current Deck ({deckCount()})</div>
          <div class="current-deck-display">
            <div class="current-deck-name">
              {currentDeckName()}
            </div>
            <div class="current-deck-stats">
              {currentCardCount()} cards • {currentTemplateCount()} templates
            </div>
          </div>
          <button class="change-deck-button" onClick={handleChangeDeck} disabled={deckCount() <= 1}>
            Change Deck
            <FiChevronDown />
          </button>
        </div>
      </Show>

      <Show when={selectedTemplate()}>
        <div class="current-deck-section">
          <div class="current-deck-label">Current Template ({templateCount()})</div>
          <div class="current-deck-display">
            <div class="current-deck-name">
              {selectedTemplate()?.name}
            </div>
          </div>
          <button class="change-deck-button" onClick={handleChangeTemplate} disabled={templateCount() <= 1}>
            Change Template
            <FiChevronDown />
          </button>
        </div>
      </Show>

      <div class="stats-section">
        <div class="stats-title">Statistics</div>
        <StatItem
          label="Cards"
          value={currentCardCount()}
        />
        <StatItem
          label="Templates"
          value={currentTemplateCount()}
        />
      </div>
    </SidePanel>
  );
}
