import { ankiCachePromise, cardsSig, setBlobSig } from "./stores";
import { setSelectedCardSig } from "./stores";
import { templatesSig } from "./stores";
import { createMemo, JSX } from "solid-js";
import { setSelectedTemplateSig } from "./stores";
import {
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
} from "./stores";
import type { Command } from "./commandPaletteStore";
import { openCommandPalette } from "./commandPaletteStore";
import { FiFolder, FiArrowRight, FiLayers, FiMoon, FiVolume2, FiVolumeX, FiPause, FiPlay, FiSettings, FiRefreshCw, FiClipboard, FiFile, FiGrid } from "solid-icons/fi";
import { css } from "solid-styled";

export function useCommands() {
  return createMemo<Command[]>(() => {
    const templates = templatesSig();
    const deckInfo = deckInfoSig();

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
        id: "select-card",
        title: "Select Card",
        icon: <FiLayers />,
        hotkey: "ctrl+S",
        children: cardsSig().map((_card, index) => `Card ${index + 1}`),
        handler: () => {
          // When the user selects this, keep the command palette open for submenu selection.
          return { keepOpen: true };
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
      ...cardsSig().map((_card, index) => ({
        id: `Card ${index + 1}`,
        title: `Card ${index + 1}`,
        icon: <FiLayers />,
        parent: "select-card",
        handler: () => {
          setSelectedCardSig(index);
        },
      })),
      ...(templates
        ? [
            {
              id: "select-template",
              title: "Select Template",
              icon: <FiClipboard />,
              hotkey: "ctrl+L",
              children: templates.map((template) => template.name),
              handler: () => {
                openCommandPalette("select-template");
                return { keepOpen: true };
              },
            },
            ...templates.map((template, index) => {
              const frontHtml = template.qfmt;
              const backHtml = template.afmt;

              return {
                id: template.name,
                title: template.name,
                icon: <FiFile />,
                parent: "select-template",
                metadata: [
                  {
                    label: "Template Front",
                    value: <TemplateViewer templateHtml={frontHtml} />
                  },
                  {
                    label: "Template Back",
                    value: <TemplateViewer templateHtml={backHtml} />
                  },
                ],
                handler: () => {
                  setSelectedTemplateSig(index);
                },
              };
            }),
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
