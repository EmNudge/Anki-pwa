import { JSX, onCleanup, createEffect, Show, mergeProps } from "solid-js";
import { css } from "solid-styled";

export type ModalSize = "sm" | "md" | "lg" | "xl";

export interface ModalProps {
  title?: string | JSX.Element;
  isOpen: boolean;
  onClose: () => void;
  children: JSX.Element;
  size?: ModalSize;
  footer?: JSX.Element;
  showCloseButton?: boolean;
  closeOnClickOutside?: boolean;
  class?: string;
}

export function Modal(props: ModalProps) {
  const merged = mergeProps(
    {
      size: "md" as ModalSize,
      showCloseButton: true,
      closeOnClickOutside: true,
    },
    props
  );

  // eslint-disable-next-line no-unused-expressions
  css`
    .ds-modal-overlay {
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

    .ds-modal {
      position: relative;
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

    .ds-modal--sm {
      width: 500px;
    }

    .ds-modal--md {
      width: 800px;
    }

    .ds-modal--lg {
      width: 1000px;
    }

    .ds-modal--xl {
      width: 1200px;
    }

    .ds-modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-4);
      border-bottom: 1px solid var(--color-border);
    }

    .ds-modal__title {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .ds-modal__content {
      padding: var(--spacing-8);
      overflow-y: auto;
      flex: 1;
    }

    .ds-modal__footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-3);
      padding: var(--spacing-4);
      border-top: 1px solid var(--color-border);
    }

    .ds-modal__close {
      background: none;
      color: var(--color-text-primary);
      border: none;
      cursor: pointer;
      transition: var(--transition-opacity);
      padding: var(--spacing-1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ds-modal__close:hover {
      opacity: 0.7;
    }

    .ds-modal__close svg {
      width: 24px;
      height: 24px;
    }
  `;

  // Handle Escape key
  createEffect(() => {
    if (!merged.isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        merged.onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    onCleanup(() => {
      window.removeEventListener("keydown", handleKeyDown);
    });
  });

  const handleOverlayClick = () => {
    if (merged.closeOnClickOutside) {
      merged.onClose();
    }
  };

  const handleContentClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Show when={merged.isOpen}>
      <div class="ds-modal-overlay" onClick={handleOverlayClick}>
        <div
          class={`ds-modal ds-modal--${merged.size} ${merged.class || ""}`}
          onClick={handleContentClick}
        >
          <Show when={merged.title || merged.showCloseButton}>
            <div class="ds-modal__header">
              <Show when={merged.title}>
                <h2 class="ds-modal__title">{merged.title}</h2>
              </Show>
              <Show when={!merged.title}>
                <div />
              </Show>
              <Show when={merged.showCloseButton}>
                <button class="ds-modal__close" onClick={merged.onClose}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path
                      d="M289.94 256l95-95A24 24 0 0 0 351 127l-95 95l-95-95a24 24 0 0 0-34 34l95 95l-95 95a24 24 0 1 0 34 34l95-95l95 95a24 24 0 0 0 34-34z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </Show>
            </div>
          </Show>

          <div class="ds-modal__content">{merged.children}</div>

          <Show when={merged.footer}>
            <div class="ds-modal__footer">{merged.footer}</div>
          </Show>
        </div>
      </div>
    </Show>
  );
}
