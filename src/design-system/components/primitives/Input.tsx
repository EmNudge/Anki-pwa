import { JSX, splitProps, Show } from "solid-js";
import { css } from "solid-styled";

export interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  errorMessage?: string;
  label?: string;
  helperText?: string;
}

export function Input(props: InputProps) {
  const [local, others] = splitProps(props, [
    "error",
    "errorMessage",
    "label",
    "helperText",
    "class",
    "id",
  ]);

  const inputId = () => local.id ?? `input-${Math.random().toString(36).slice(2, 11)}`;

  // eslint-disable-next-line no-unused-expressions
  css`
    .ds-input-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1);
    }

    .ds-input-label {
      display: block;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    .ds-input {
      width: 100%;
      padding: var(--spacing-2) var(--spacing-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface-elevated);
      color: var(--color-text-primary);
      font-size: var(--font-size-sm);
      font-family: var(--font-family-sans);
      line-height: var(--line-height-normal);
      transition: var(--transition-colors);
    }

    .ds-input::placeholder {
      color: var(--color-text-tertiary);
    }

    .ds-input:hover:not(:disabled) {
      border-color: var(--color-border-hover);
    }

    .ds-input:focus {
      outline: none;
      border-color: var(--color-border-focus);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .ds-input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .ds-input--error {
      border-color: var(--color-error-500);
    }

    .ds-input--error:focus {
      border-color: var(--color-error-500);
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .ds-input-helper-text {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
    }

    .ds-input-error-message {
      font-size: var(--font-size-xs);
      color: var(--color-error-500);
    }
  `;

  const inputClasses = () =>
    ["ds-input", local.error ? "ds-input--error" : undefined, local.class]
      .filter(Boolean)
      .join(" ");

  return (
    <div class="ds-input-wrapper">
      <Show when={local.label}>
        <label class="ds-input-label" for={inputId()}>
          {local.label}
        </label>
      </Show>
      <input id={inputId()} class={inputClasses()} {...others} />
      <Show when={local.error && local.errorMessage}>
        <span class="ds-input-error-message">{local.errorMessage}</span>
      </Show>
      <Show when={!local.error && local.helperText}>
        <span class="ds-input-helper-text">{local.helperText}</span>
      </Show>
    </div>
  );
}
