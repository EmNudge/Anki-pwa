import { JSX, splitProps } from "solid-js";
import { css } from "solid-styled";

export type CardVariant = "flat" | "elevated" | "outlined";
export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
}

export function Card(props: CardProps) {
  const [local, others] = splitProps(props, [
    "variant",
    "padding",
    "children",
    "class",
  ]);

  const variant = () => local.variant ?? "elevated";
  const padding = () => local.padding ?? "md";

  // eslint-disable-next-line no-unused-expressions
  css`
    .ds-card {
      background: var(--color-surface);
      border-radius: var(--radius-md);
    }

    /* Variants */
    .ds-card--flat {
      border: none;
      box-shadow: none;
    }

    .ds-card--elevated {
      border: none;
      box-shadow: var(--shadow-base);
    }

    .ds-card--outlined {
      border: 1px solid var(--color-border);
      box-shadow: none;
    }

    /* Padding */
    .ds-card--padding-none {
      padding: 0;
    }

    .ds-card--padding-sm {
      padding: var(--spacing-3);
    }

    .ds-card--padding-md {
      padding: var(--spacing-4);
    }

    .ds-card--padding-lg {
      padding: var(--spacing-6);
    }
  `;

  const classes = () => {
    const classList: string[] = ["ds-card"];
    classList.push(`ds-card--${variant()}`);
    classList.push(`ds-card--padding-${padding()}`);
    if (local.class) classList.push(local.class);
    return classList.join(" ");
  };

  return (
    <div class={classes()} {...others}>
      {local.children}
    </div>
  );
}
