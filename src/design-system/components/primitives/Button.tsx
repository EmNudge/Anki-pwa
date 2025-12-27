import { JSX, splitProps, Show } from "solid-js";
import { css } from "solid-styled";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  iconLeft?: JSX.Element;
  iconRight?: JSX.Element;
}

export function Button(props: ButtonProps) {
  const [local, others] = splitProps(props, [
    "variant",
    "size",
    "fullWidth",
    "loading",
    "iconLeft",
    "iconRight",
    "children",
    "disabled",
    "class",
  ]);

  const variant = () => local.variant ?? "primary";
  const size = () => local.size ?? "md";

  // eslint-disable-next-line no-unused-expressions
  css`
    .ds-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-2);
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      font-family: var(--font-family-sans);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: var(--transition-colors);
      white-space: nowrap;
      user-select: none;
    }

    .ds-button:focus-visible {
      outline: 2px solid var(--color-border-focus);
      outline-offset: 2px;
    }

    .ds-button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    /* Variants */
    .ds-button--primary {
      background: var(--color-primary-500);
      color: var(--color-text-inverse);
      border-color: var(--color-primary-500);
    }

    .ds-button--primary:hover:not(:disabled) {
      background: var(--color-primary-600);
      border-color: var(--color-primary-600);
    }

    .ds-button--primary:active:not(:disabled) {
      background: var(--color-primary-700);
      border-color: var(--color-primary-700);
    }

    .ds-button--secondary {
      background: transparent;
      color: var(--color-text-primary);
      border-color: var(--color-border);
    }

    .ds-button--secondary:hover:not(:disabled) {
      background: var(--color-surface-elevated);
      border-color: var(--color-border-hover);
    }

    .ds-button--secondary:active:not(:disabled) {
      background: var(--color-surface);
    }

    .ds-button--ghost {
      background: transparent;
      color: var(--color-text-primary);
      border-color: transparent;
    }

    .ds-button--ghost:hover:not(:disabled) {
      background: var(--color-surface);
    }

    .ds-button--ghost:active:not(:disabled) {
      background: var(--color-surface-elevated);
    }

    .ds-button--danger {
      background: var(--color-error-500);
      color: var(--color-text-inverse);
      border-color: var(--color-error-500);
    }

    .ds-button--danger:hover:not(:disabled) {
      background: var(--color-error-600);
      border-color: var(--color-error-600);
    }

    .ds-button--danger:active:not(:disabled) {
      background: var(--color-error-700);
      border-color: var(--color-error-700);
    }

    /* Sizes */
    .ds-button--sm {
      padding: var(--spacing-1-5) var(--spacing-3);
      font-size: var(--font-size-sm);
      line-height: var(--line-height-tight);
    }

    .ds-button--md {
      padding: var(--spacing-2) var(--spacing-4);
      font-size: var(--font-size-base);
      line-height: var(--line-height-normal);
    }

    .ds-button--lg {
      padding: var(--spacing-3) var(--spacing-6);
      font-size: var(--font-size-lg);
      line-height: var(--line-height-normal);
    }

    /* Full Width */
    .ds-button--full-width {
      width: 100%;
    }

    /* Loading */
    .ds-button-spinner {
      display: inline-block;
      width: 1em;
      height: 1em;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: var(--radius-full);
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;

  const classes = () => {
    return [
      "ds-button",
      `ds-button--${variant()}`,
      `ds-button--${size()}`,
      local.fullWidth ? "ds-button--full-width" : undefined,
      local.class,
    ]
      .filter(Boolean)
      .join(" ");
  };

  return (
    <button
      class={classes()}
      disabled={local.disabled || local.loading}
      {...others}
    >
      <Show when={local.loading}>
        <span class="ds-button-spinner" aria-label="Loading" />
      </Show>
      <Show when={!local.loading && local.iconLeft}>{local.iconLeft}</Show>
      {local.children}
      <Show when={!local.loading && local.iconRight}>{local.iconRight}</Show>
    </button>
  );
}
