import { JSX, splitProps, Show } from "solid-js";
import { css } from "solid-styled";

export interface SelectProps extends JSX.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  errorMessage?: string;
  label?: string;
  helperText?: string;
}

export function Select(props: SelectProps) {
  const [local, others] = splitProps(props, [
    "error",
    "errorMessage",
    "label",
    "helperText",
    "class",
    "id",
    "children",
  ]);

  const selectId = () => local.id ?? `select-${Math.random().toString(36).substr(2, 9)}`;

  // eslint-disable-next-line no-unused-expressions
  css`
    .ds-select-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1);
    }

    .ds-select-label {
      display: block;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    .ds-select {
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
      cursor: pointer;
    }

    .ds-select:hover:not(:disabled) {
      border-color: var(--color-border-hover);
    }

    .ds-select:focus {
      outline: none;
      border-color: var(--color-border-focus);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .ds-select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .ds-select--error {
      border-color: var(--color-error-500);
    }

    .ds-select--error:focus {
      border-color: var(--color-error-500);
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .ds-select-helper-text {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
    }

    .ds-select-error-message {
      font-size: var(--font-size-xs);
      color: var(--color-error-500);
    }
  `;

  const selectClasses = () => {
    const classList: string[] = ["ds-select"];
    if (local.error) classList.push("ds-select--error");
    if (local.class) classList.push(local.class);
    return classList.join(" ");
  };

  return (
    <div class="ds-select-wrapper">
      <Show when={local.label}>
        <label class="ds-select-label" for={selectId()}>
          {local.label}
        </label>
      </Show>
      <select id={selectId()} class={selectClasses()} {...others}>
        {local.children}
      </select>
      <Show when={local.error && local.errorMessage}>
        <span class="ds-select-error-message">{local.errorMessage}</span>
      </Show>
      <Show when={!local.error && local.helperText}>
        <span class="ds-select-helper-text">{local.helperText}</span>
      </Show>
    </div>
  );
}
