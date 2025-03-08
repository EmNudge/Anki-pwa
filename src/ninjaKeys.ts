import { cards, setBlob } from "./stores";
import { setSelectedCard } from "./stores";
import { templates } from "./stores";
import { createEffect } from "solid-js";
import { setSelectedTemplate } from "./stores";
import { assertTruthy } from "./utils/assert";
import "ninja-keys";

function addCommandsToCommandPalette() {
  const ninja = document.querySelector("ninja-keys");
  assertTruthy(ninja, "ninja-keys not found");

  ninja.data = [
    {
      id: "upload-file",
      title: "Upload Anki Deck",
      hotkey: "ctrl+N",
      handler: () => {
        const inputEl = document.createElement("input");
        inputEl.type = "file";
        inputEl.addEventListener("change", (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            setBlob(file);
          }
        });
        inputEl.click();
      },
    },
    {
      id: "next-card",  
      title: "Next Card",
      hotkey: "ctrl+N",
      handler: () => {
        setSelectedCard((prevCard) => prevCard + 1);
      },
    },
    {
      id: "select-card",
      title: "Select Card",
      hotkey: "ctrl+S",
      children: cards().map((_card, index) => `Card ${index + 1}`),
      handler: () => {
        ninja.open({ parent: 'select-card' });
        return {keepOpen: true};
      },
    },
    {
      id: "select-template",
      title: "Select Template",
      hotkey: "ctrl+T",
      children: templates().map((template) => template.name),
      handler: () => {
        ninja.open({ parent: 'select-template' });
        return {keepOpen: true};
      },
    },
    ...cards().map((_card, index) => ({
      id: `Card ${index + 1}`,
      title: `Card ${index + 1}`,
      parent: "select-card",
      handler: () => {
        setSelectedCard(index);
      },
    })),
    ...templates().map((template, index) => ({
      id: template.name,
      title: template.name,
      parent: "select-template",
      handler: () => {
        setSelectedTemplate(index);
      },
    })),
  ];
}

createEffect(addCommandsToCommandPalette);