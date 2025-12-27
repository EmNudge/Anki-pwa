import { ankiCachePromise, ankiDataSig, cardsSig, setBlobSig } from "./stores";
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
  resetScheduler,
  backgroundFxEnabledSig,
  toggleBackgroundFx,
} from "./stores";
import type { Command } from "./commandPaletteStore";
import { FiFolder, FiArrowRight, FiLayers, FiMoon, FiVolume2, FiVolumeX, FiPause, FiPlay, FiSettings, FiRefreshCw, FiClipboard, FiFile } from "solid-icons/fi";

export function useCommands() {
  return createMemo<Command[]>(() => {
    const templates = templatesSig();
    const ankiData = ankiDataSig();
    console.log("computing commands, ankiData:", ankiData);

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
                // Keep palette open to choose a template
                return { keepOpen: true };
              },
            },
            ...templates.map((template, index) => ({
              id: template.name,
              title: template.name,
              icon: <FiFile />,
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
