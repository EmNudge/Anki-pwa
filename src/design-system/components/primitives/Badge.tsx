import { JSX, splitProps } from "solid-js";
import { css } from "solid-styled";

export type BadgeVariant = "success" | "error" | "warning" | "neutral" | "primary";
export type BadgeSize = "sm" | "md" | "lg";
export type BadgeStyle = "filled" | "outlined" | "soft";

export interface BadgeProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  badgeStyle?: BadgeStyle;
}

export function Badge(props: BadgeProps) {
  const [local, others] = splitProps(props, [
    "variant",
    "size",
    "badgeStyle",
    "children",
    "class",
  ]);

  const variant = () => local.variant ?? "neutral";
  const size = () => local.size ?? "md";
  const badgeStyle = () => local.badgeStyle ?? "filled";

  // eslint-disable-next-line no-unused-expressions
  css`
    .ds-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-full);
      font-family: var(--font-family-sans);
      font-weight: var(--font-weight-medium);
      white-space: nowrap;
      border: 1px solid transparent;
    }

    /* Sizes */
    .ds-badge--sm {
      padding: var(--spacing-0-5) var(--spacing-2);
      font-size: var(--font-size-xs);
      line-height: var(--line-height-tight);
    }

    .ds-badge--md {
      padding: var(--spacing-1) var(--spacing-3);
      font-size: var(--font-size-sm);
      line-height: var(--line-height-tight);
    }

    .ds-badge--lg {
      padding: var(--spacing-1-5) var(--spacing-4);
      font-size: var(--font-size-base);
      line-height: var(--line-height-tight);
    }

    /* Success Variants */
    .ds-badge--success-filled {
      background: var(--color-success-500);
      color: white;
    }

    .ds-badge--success-outlined {
      background: transparent;
      color: var(--color-success-600);
      border-color: var(--color-success-500);
    }

    .ds-badge--success-soft {
      background: var(--color-success-100);
      color: var(--color-success-700);
    }

    /* Error Variants */
    .ds-badge--error-filled {
      background: var(--color-error-500);
      color: white;
    }

    .ds-badge--error-outlined {
      background: transparent;
      color: var(--color-error-600);
      border-color: var(--color-error-500);
    }

    .ds-badge--error-soft {
      background: var(--color-error-100);
      color: var(--color-error-700);
    }

    /* Warning Variants */
    .ds-badge--warning-filled {
      background: var(--color-warning-500);
      color: white;
    }

    .ds-badge--warning-outlined {
      background: transparent;
      color: var(--color-warning-600);
      border-color: var(--color-warning-500);
    }

    .ds-badge--warning-soft {
      background: var(--color-warning-100);
      color: var(--color-warning-700);
    }

    /* Neutral Variants */
    .ds-badge--neutral-filled {
      background: var(--color-neutral-500);
      color: white;
    }

    .ds-badge--neutral-outlined {
      background: transparent;
      color: var(--color-text-primary);
      border-color: var(--color-border);
    }

    .ds-badge--neutral-soft {
      background: var(--color-neutral-200);
      color: var(--color-neutral-700);
    }

    /* Primary Variants */
    .ds-badge--primary-filled {
      background: var(--color-primary-500);
      color: white;
    }

    .ds-badge--primary-outlined {
      background: transparent;
      color: var(--color-primary-600);
      border-color: var(--color-primary-500);
    }

    .ds-badge--primary-soft {
      background: var(--color-primary-100);
      color: var(--color-primary-700);
    }
  `;

  const classes = () =>
    [
      "ds-badge",
      `ds-badge--${size()}`,
      `ds-badge--${variant()}-${badgeStyle()}`,
      local.class,
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <span class={classes()} {...others}>
      {local.children}
    </span>
  );
}
