import { JSX, splitProps } from "solid-js";
import { css } from "solid-styled";

export type StackDirection = "vertical" | "horizontal";
export type StackAlign = "start" | "center" | "end" | "stretch";
export type StackJustify = "start" | "center" | "end" | "between" | "around";
export type StackSpacing = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12";

export interface StackProps extends JSX.HTMLAttributes<HTMLDivElement> {
  direction?: StackDirection;
  align?: StackAlign;
  justify?: StackJustify;
  spacing?: StackSpacing;
  wrap?: boolean;
}

export function Stack(props: StackProps) {
  const [local, others] = splitProps(props, [
    "direction",
    "align",
    "justify",
    "spacing",
    "wrap",
    "children",
    "class",
  ]);

  const direction = () => local.direction ?? "vertical";
  const spacing = () => local.spacing ?? "4";

  // eslint-disable-next-line no-unused-expressions
  css`
    .ds-stack {
      display: flex;
    }

    .ds-stack--vertical {
      flex-direction: column;
    }

    .ds-stack--horizontal {
      flex-direction: row;
    }

    .ds-stack--wrap {
      flex-wrap: wrap;
    }

    /* Alignment */
    .ds-stack--align-start {
      align-items: flex-start;
    }

    .ds-stack--align-center {
      align-items: center;
    }

    .ds-stack--align-end {
      align-items: flex-end;
    }

    .ds-stack--align-stretch {
      align-items: stretch;
    }

    /* Justify */
    .ds-stack--justify-start {
      justify-content: flex-start;
    }

    .ds-stack--justify-center {
      justify-content: center;
    }

    .ds-stack--justify-end {
      justify-content: flex-end;
    }

    .ds-stack--justify-between {
      justify-content: space-between;
    }

    .ds-stack--justify-around {
      justify-content: space-around;
    }

    /* Spacing */
    .ds-stack--spacing-0 {
      gap: var(--spacing-0);
    }

    .ds-stack--spacing-1 {
      gap: var(--spacing-1);
    }

    .ds-stack--spacing-2 {
      gap: var(--spacing-2);
    }

    .ds-stack--spacing-3 {
      gap: var(--spacing-3);
    }

    .ds-stack--spacing-4 {
      gap: var(--spacing-4);
    }

    .ds-stack--spacing-5 {
      gap: var(--spacing-5);
    }

    .ds-stack--spacing-6 {
      gap: var(--spacing-6);
    }

    .ds-stack--spacing-8 {
      gap: var(--spacing-8);
    }

    .ds-stack--spacing-10 {
      gap: var(--spacing-10);
    }

    .ds-stack--spacing-12 {
      gap: var(--spacing-12);
    }
  `;

  const classes = () => {
    const classList: string[] = ["ds-stack"];
    classList.push(`ds-stack--${direction()}`);
    classList.push(`ds-stack--spacing-${spacing()}`);
    if (local.align) classList.push(`ds-stack--align-${local.align}`);
    if (local.justify) classList.push(`ds-stack--justify-${local.justify}`);
    if (local.wrap) classList.push("ds-stack--wrap");
    if (local.class) classList.push(local.class);
    return classList.join(" ");
  };

  return (
    <div class={classes()} {...others}>
      {local.children}
    </div>
  );
}
