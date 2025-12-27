import { JSX, splitProps } from "solid-js";
import { css } from "solid-styled";

export type FlexDirection = "row" | "row-reverse" | "column" | "column-reverse";
export type FlexAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type FlexJustify = "start" | "center" | "end" | "between" | "around" | "evenly";
export type FlexGap = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12";

export interface FlexProps extends JSX.HTMLAttributes<HTMLDivElement> {
  direction?: FlexDirection;
  align?: FlexAlign;
  justify?: FlexJustify;
  gap?: FlexGap;
  wrap?: boolean;
}

export function Flex(props: FlexProps) {
  const [local, others] = splitProps(props, [
    "direction",
    "align",
    "justify",
    "gap",
    "wrap",
    "children",
    "class",
  ]);

  const direction = () => local.direction ?? "row";
  const gap = () => local.gap ?? "0";

  // eslint-disable-next-line no-unused-expressions
  css`
    .ds-flex {
      display: flex;
    }

    /* Direction */
    .ds-flex--dir-row {
      flex-direction: row;
    }

    .ds-flex--dir-row-reverse {
      flex-direction: row-reverse;
    }

    .ds-flex--dir-column {
      flex-direction: column;
    }

    .ds-flex--dir-column-reverse {
      flex-direction: column-reverse;
    }

    /* Wrap */
    .ds-flex--wrap {
      flex-wrap: wrap;
    }

    /* Align */
    .ds-flex--align-start {
      align-items: flex-start;
    }

    .ds-flex--align-center {
      align-items: center;
    }

    .ds-flex--align-end {
      align-items: flex-end;
    }

    .ds-flex--align-stretch {
      align-items: stretch;
    }

    .ds-flex--align-baseline {
      align-items: baseline;
    }

    /* Justify */
    .ds-flex--justify-start {
      justify-content: flex-start;
    }

    .ds-flex--justify-center {
      justify-content: center;
    }

    .ds-flex--justify-end {
      justify-content: flex-end;
    }

    .ds-flex--justify-between {
      justify-content: space-between;
    }

    .ds-flex--justify-around {
      justify-content: space-around;
    }

    .ds-flex--justify-evenly {
      justify-content: space-evenly;
    }

    /* Gap */
    .ds-flex--gap-0 {
      gap: var(--spacing-0);
    }

    .ds-flex--gap-1 {
      gap: var(--spacing-1);
    }

    .ds-flex--gap-2 {
      gap: var(--spacing-2);
    }

    .ds-flex--gap-3 {
      gap: var(--spacing-3);
    }

    .ds-flex--gap-4 {
      gap: var(--spacing-4);
    }

    .ds-flex--gap-5 {
      gap: var(--spacing-5);
    }

    .ds-flex--gap-6 {
      gap: var(--spacing-6);
    }

    .ds-flex--gap-8 {
      gap: var(--spacing-8);
    }

    .ds-flex--gap-10 {
      gap: var(--spacing-10);
    }

    .ds-flex--gap-12 {
      gap: var(--spacing-12);
    }
  `;

  const classes = () =>
    [
      "ds-flex",
      `ds-flex--dir-${direction()}`,
      `ds-flex--gap-${gap()}`,
      local.align ? `ds-flex--align-${local.align}` : undefined,
      local.justify ? `ds-flex--justify-${local.justify}` : undefined,
      local.wrap ? "ds-flex--wrap" : undefined,
      local.class,
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div class={classes()} {...others}>
      {local.children}
    </div>
  );
}
