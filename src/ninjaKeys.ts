import { ankiCachePromise, ankiDataSig, cardsSig, setBlobSig, setDeckInfoSig } from "./stores";
import { setSelectedCardSig } from "./stores";
import { templatesSig } from "./stores";
import { createEffect, createRoot } from "solid-js";
import { setSelectedTemplateSig } from "./stores";
import { assertTruthy } from "./utils/assert";
import {
  schedulerEnabledSig,
  soundEffectsEnabledSig,
  toggleScheduler,
  toggleSoundEffects,
} from "./stores";
import "ninja-keys";

function addCommandsToCommandPalette() {
  const ninja = document.querySelector("ninja-keys");
  assertTruthy(ninja, "ninja-keys not found");

  const templates = templatesSig();

  const ankiData = ankiDataSig();
  console.log("addCommandsToCommandPalette called, ankiData:", ankiData);

  ninja.data = [
    {
      id: "upload-file",
      title: "Upload Anki Deck",
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
      hotkey: ">",
      handler: () => {
        setSelectedCardSig((prevCard) => prevCard + 1);
      },
    },
    {
      id: "select-card",
      title: "Select Card",
      hotkey: "ctrl+S",
      children: cardsSig().map((_card, index) => `Card ${index + 1}`),
      handler: () => {
        ninja.open({ parent: "select-card" });
        return { keepOpen: true };
      },
    },
    {
      id: "toggle-theme",
      title: "Toggle Theme",
      hotkey: "ctrl+T",
      handler: () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "light" ? "dark" : "light";
        if (newTheme === "dark") {
          ninja.classList.add("dark");
        } else {
          ninja.classList.remove("dark");
        }
        document.documentElement.setAttribute("data-theme", newTheme);
      },
    },
    {
      id: "toggle-sound-effects",
      title: `${soundEffectsEnabledSig() ? "Disable" : "Enable"} Sound Effects`,
      hotkey: "ctrl+E",
      handler: () => {
        toggleSoundEffects();
      },
    },
    {
      id: "toggle-scheduler",
      title: `${schedulerEnabledSig() ? "Disable" : "Enable"} SM-2 Scheduler`,
      hotkey: "ctrl+R",
      handler: () => {
        toggleScheduler();
      },
    },
    ...cardsSig().map((_card, index) => ({
      id: `Card ${index + 1}`,
      title: `Card ${index + 1}`,
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
            hotkey: "ctrl+T",
            children: templates.map((template) => template.name),
            handler: () => {
              ninja.open({ parent: "select-template" });
              return { keepOpen: true };
            },
          },
          ...templates.map((template, index) => ({
            id: template.name,
            title: template.name,
            parent: "select-template",
            handler: () => {
              setSelectedTemplateSig(index);
            },
          })),
        ]
      : []),
  ];
}

createRoot(() => {
  createEffect(addCommandsToCommandPalette);
});
