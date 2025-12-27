import { ankiCachePromise, setBlobSig } from "./stores";
import { setSelectedCardSig } from "./stores";
import { createMemo, JSX } from "solid-js";
import {
  ankiDataSig,
  schedulerEnabledSig,
  soundEffectsEnabledSig,
  toggleScheduler,
  toggleSoundEffects,
  setSchedulerSettingsModalOpenSig,
  resetScheduler,
  backgroundFxEnabledSig,
  toggleBackgroundFx,
  deckInfoSig,
  setSelectedDeckIdSig,
  selectedDeckIdSig,
} from "./stores";
import type { Command } from "./commandPaletteStore";
import { openCommandPalette } from "./commandPaletteStore";
import { FiFolder, FiArrowRight, FiLayers, FiMoon, FiVolume2, FiVolumeX, FiPause, FiPlay, FiSettings, FiRefreshCw, FiClipboard, FiFile, FiGrid } from "solid-icons/fi";
import { css } from "solid-styled";

export function useCommands() {
  return createMemo<Command[]>(() => {
    const deckInfo = deckInfoSig();
    const ankiData = ankiDataSig();
    const selectedDeckId = selectedDeckIdSig();
    const currentDeckName = (() => {
      if (!ankiData || !selectedDeckId) return null;
      const deck = ankiData.decks[selectedDeckId];
      return deck ? deck.name : null;
    })();

    const commands: Command[] = [
      {
        id: "upload-file",
        title: "Upload Anki Deck",
        icon: <FiFolder />,
        hotkey: "ctrl+N",
        handler: () => {
          const inputEl = document.createElement("input");
          inputEl.type = "file";
          inputEl.addEventListener("change", async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              await ankiCachePromise.then((cache) => cache.put("anki-deck", new Response(file)));
              setBlobSig(file);
            }
          });
          inputEl.click();
        },
      },
      {
        id: "next-card",
        title: "Next Card",
        icon: <FiArrowRight />,
        hotkey: ">",
        handler: () => {
          setSelectedCardSig((prevCard) => prevCard + 1);
        },
      },
      {
        id: "toggle-theme",
        title: "Toggle Theme",
        icon: <FiMoon />,
        hotkey: "ctrl+T",
        handler: () => {
          const currentTheme = document.documentElement.getAttribute("data-theme");
          const newTheme = currentTheme === "light" ? "dark" : "light";
          document.documentElement.setAttribute("data-theme", newTheme);
          localStorage.setItem("theme", newTheme);
        },
      },
      {
        id: "toggle-sound-effects",
        title: `${soundEffectsEnabledSig() ? "Disable" : "Enable"} Sound Effects`,
        icon: soundEffectsEnabledSig() ? <FiVolume2 /> : <FiVolumeX />,
        hotkey: "ctrl+E",
        handler: () => {
          toggleSoundEffects();
        },
      },
      {
        id: "toggle-background-fx",
        title: `${backgroundFxEnabledSig() ? "Disable" : "Enable"} Background Animation`,
        icon: backgroundFxEnabledSig() ? <FiPause /> : <FiPlay />,
        handler: () => {
          toggleBackgroundFx();
        },
      },
      {
        id: "toggle-scheduler",
        title: `${schedulerEnabledSig() ? "Disable" : "Enable"} Scheduler`,
        icon: schedulerEnabledSig() ? <FiPause /> : <FiPlay />,
        hotkey: "ctrl+R",
        handler: () => {
          toggleScheduler();
        },
      },
      {
        id: "scheduler-settings",
        title: "Scheduler Settings",
        icon: <FiSettings />,
        hotkey: "ctrl+,",
        handler: () => {
          setSchedulerSettingsModalOpenSig(true);
        },
      },
      {
        id: "reset-scheduler",
        title: "Reset Scheduler",
        icon: <FiRefreshCw />,
        handler: () => {
          resetScheduler();
        },
      },
      ...(deckInfo && deckInfo.subdecks.length > 0
        ? [
            {
              id: "switch-deck",
              title: "Switch Deck",
              icon: <FiGrid />,
              hotkey: "ctrl+D",
              children: ["all", ...deckInfo.subdecks.map((subdeck) => subdeck.id)],
              handler: () => {
                openCommandPalette("switch-deck");
                return { keepOpen: true };
              },
            },
            {
              id: "all",
              title: "All Cards",
              icon: <FiLayers />,
              parent: "switch-deck",
              metadata: [
                { label: "Cards", value: deckInfo.cardCount.toString() },
                { label: "Templates", value: deckInfo.templateCount.toString() },
              ],
              handler: () => {
                setSelectedDeckIdSig(null);
              },
            },
            ...deckInfo.subdecks.map((subdeck) => ({
              id: subdeck.id,
              title: subdeck.name,
              icon: <FiLayers />,
              parent: "switch-deck",
              metadata: [
                { label: "Cards", value: subdeck.cardCount.toString() },
                { label: "Templates", value: subdeck.templateCount.toString() },
              ],
              handler: () => {
                setSelectedDeckIdSig(subdeck.id);
              },
            })),
          ]
        : []),
      ...(ankiData
        ? [
            {
              id: "browse-notes",
              title: "Browse All Notes",
              icon: <FiLayers />,
              children: ankiData.cards.map((_card, index) => `Note ${index + 1}`),
              handler: () => {
                return { keepOpen: true };
              },
            },
            ...ankiData.cards.map((card, index) => {
              const firstFieldValue = Object.values(card.values)[0];
              const raw = typeof firstFieldValue === "string" ? firstFieldValue : "";
              const text = raw.replace(/<[^>]*>/g, "").trim();
              const preview = text.length > 30 ? `${text.slice(0, 30)}...` : text;
              const title = text ? `Note ${index + 1}: ${preview}` : `Note ${index + 1}`;

              const label = currentDeckName && card.deckName === currentDeckName ? "In current deck" : undefined;

              const metadata = [
                ...Object.entries(card.values).map(([fieldName, fieldValue]) => ({
                  label: fieldName,
                  value: <div style={{ "white-space": "pre-wrap", "word-break": "break-word" }}>{fieldValue}</div>,
                })),
                ...(card.deckName ? [{ label: "Deck", value: card.deckName }] : []),
                { label: `Templates ${card.templates.length}`, value: card.templates.map((t) => t.name).join(", ") },
              ];

              return {
                id: `Note ${index + 1}`,
                title,
                icon: <FiLayers />,
                parent: "browse-notes",
                label,
                metadata,
                handler: () => {
                  return { keepOpen: true };
                },
              } satisfies Command;
            }),
            ...(() => {
              const uniqueTemplates = Array.from(
                (ankiData.cards.flatMap((c) => c.templates) ?? []).reduce<Map<string, { name: string; qfmt: string; afmt: string }>>(
                  (acc, t) => (acc.has(t.name) ? acc : acc.set(t.name, t)),
                  new Map(),
                ).values(),
              );
              const currentDeckTemplateNames = new Set(
                (currentDeckName ? ankiData.cards.filter((c) => c.deckName === currentDeckName) : []).flatMap((c) =>
                  c.templates.map((t) => t.name),
                ),
              );

              const items: Command[] = [
                {
                  id: "browse-templates",
                  title: "Browse All Templates",
                  icon: <FiClipboard />,
                  hotkey: "ctrl+L",
                  children: uniqueTemplates.map((t) => t.name),
                  handler: () => {
                    openCommandPalette("view-template");
                    return { keepOpen: true };
                  },
                },
                ...uniqueTemplates.map((t) => ({
                  id: `AllTpl:${t.name}`,
                  title: t.name,
                  icon: <FiFile />,
                  parent: "browse-templates",
                  label: currentDeckName && currentDeckTemplateNames.has(t.name) ? "In current deck" : undefined,
                  metadata: [
                    { label: "Template Front", value: <TemplateViewer templateHtml={t.qfmt} /> },
                    { label: "Template Back", value: <TemplateViewer templateHtml={t.afmt} /> },
                  ],
                })),
              ];
              return items;
            })(),
          ]
        : []),
    ];

    return commands;
  });
}

const TemplateViewer = (props: { templateHtml: string }) => {
  const highlightedHtml = highlightTemplateVariables(props.templateHtml);

  // eslint-disable-next-line no-unused-expressions
  css`
    .metadata-value-code {
      font-family: var(--font-family-mono);
      font-size: var(--font-size-xs);
      background: var(--color-surface-elevated);
      padding: var(--spacing-2);
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
    }

    .metadata-value-code :global(span) {
      color: var(--color-primary-300);
    }
  `;

  return <div class="metadata-value-code">{highlightedHtml}</div>;
}


function highlightTemplateVariables(templateStr: string) {
  const parts: (string | JSX.Element)[] = [];
  const regex = /(\{\{[^}]+\}\})/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(templateStr)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(templateStr.slice(lastIndex, match.index));
    }
    // Add the highlighted variable
    parts.push(<span class="template-variable">{match[0]}</span>);
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < templateStr.length) {
    parts.push(templateStr.slice(lastIndex));
  }

  return parts;
}
