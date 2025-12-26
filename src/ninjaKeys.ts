import { ankiCachePromise, ankiDataSig, cardsSig, setBlobSig, setDeckInfoSig } from "./stores";
import { setSelectedCardSig } from "./stores";
import { templatesSig } from "./stores";
import { createMemo } from "solid-js";
import { setSelectedTemplateSig } from "./stores";
import {
  schedulerEnabledSig,
  soundEffectsEnabledSig,
  toggleScheduler,
  toggleSoundEffects,
  setSchedulerSettingsModalOpenSig,
} from "./stores";
import type { Command } from "./commandPaletteStore";

export function useCommands() {
  return createMemo<Command[]>(() => {
    const templates = templatesSig();
    const ankiData = ankiDataSig();
    console.log("computing commands, ankiData:", ankiData);

    const commands: Command[] = [
      {
        id: "upload-file",
        title: "Upload Anki Deck",
        icon: "📂",
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
      ...(ankiData
        ? [
            {
              id: "deck-info",
              title: "Deck Info",
              icon: "ℹ️",
              hotkey: "ctrl+I",
              handler: () => {
                console.log("deck-info handler called!");
                // Count unique templates across all cards
                const uniqueTemplates = new Set<string>();
                ankiData.cards.forEach((card) => {
                  card.templates.forEach((template) => {
                    uniqueTemplates.add(template.name);
                  });
                });

                const deckInfo = {
                  name: ankiData.files.get("info.txt") ?? "Unknown",
                  cardCount: ankiData.cards.length,
                  templateCount: uniqueTemplates.size,
                };
                console.log("Setting deckInfoSig to:", deckInfo);
                setDeckInfoSig(deckInfo);
              },
            },
          ]
        : []),
      {
        id: "next-card",
        title: "Next Card",
        icon: "→",
        hotkey: ">",
        handler: () => {
          setSelectedCardSig((prevCard) => prevCard + 1);
        },
      },
      {
        id: "select-card",
        title: "Select Card",
        icon: "🃏",
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
        icon: "🌓",
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
        icon: soundEffectsEnabledSig() ? "🔊" : "🔇",
        hotkey: "ctrl+E",
        handler: () => {
          toggleSoundEffects();
        },
      },
      {
        id: "toggle-scheduler",
        title: `${schedulerEnabledSig() ? "Disable" : "Enable"} Scheduler`,
        icon: schedulerEnabledSig() ? "⏸️" : "▶️",
        hotkey: "ctrl+R",
        handler: () => {
          toggleScheduler();
        },
      },
      {
        id: "scheduler-settings",
        title: "Scheduler Settings",
        icon: "⚙️",
        hotkey: "ctrl+,",
        handler: () => {
          setSchedulerSettingsModalOpenSig(true);
        },
      },
      ...cardsSig().map((_card, index) => ({
        id: `Card ${index + 1}`,
        title: `Card ${index + 1}`,
        icon: "🃏",
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
              icon: "📋",
              hotkey: "ctrl+L",
              children: templates.map((template) => template.name),
              handler: () => {
                // Keep palette open to choose a template
                return { keepOpen: true };
              },
            },
            ...templates.map((template, index) => ({
              id: template.name,
              title: template.name,
              icon: "📄",
              parent: "select-template",
              handler: () => {
                setSelectedTemplateSig(index);
              },
            })),
          ]
        : []),
    ];

    return commands;
  });
}
