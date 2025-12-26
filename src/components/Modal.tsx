import { JSX, onCleanup, createEffect, Show } from "solid-js";
import { css } from "solid-styled";

export function Modal(props: {
  title: string;
  isOpen: boolean;
  children: JSX.Element;
  onClose: () => void;
}) {
  // eslint-disable-next-line no-unused-expressions
  css`
    .modal-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(--color-overlay);
      backdrop-filter: blur(10px);

      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--z-index-modal);
    }

    .modal {
      position: relative;
      width: 800px;
      max-width: 90vw;
      max-height: 90vh;
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);

      display: flex;
      flex-direction: column;
      z-index: calc(var(--z-index-modal) + 1);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-4);
      border-bottom: 1px solid var(--color-border);
    }

    .content {
      padding: var(--spacing-8);
      overflow-y: auto;
    }

    button {
      background: none;
      color: var(--color-text-primary);
      border: none;
      cursor: pointer;
      transition: var(--transition-opacity);
    }

    button:hover {
      opacity: 0.7;
    }

    button svg {
      width: 24px;
      height: 24px;
    }
  `;

  createEffect(() => {
    if (!props.isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        props.onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    onCleanup(() => {
      window.removeEventListener("keydown", handleKeyDown);
    });
  });

  return (
    <Show when={props.isOpen}>
      <div class="modal-container">
        <div class="modal">
          <div class="header">
            <h2 class="title">{props.title}</h2>

            <button class="close" onClick={props.onClose}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path
                  d="M289.94 256l95-95A24 24 0 0 0 351 127l-95 95l-95-95a24 24 0 0 0-34 34l95 95l-95 95a24 24 0 1 0 34 34l95-95l95 95a24 24 0 0 0 34-34z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>

          <div class="content">{props.children}</div>
        </div>
      </div>
    </Show>
  );
}
