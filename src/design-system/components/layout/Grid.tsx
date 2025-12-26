import { JSX, splitProps } from "solid-js";
import { css } from "solid-styled";

export type GridColumns = "1" | "2" | "3" | "4" | "6" | "12";
export type GridGap = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12";

export interface GridProps extends JSX.HTMLAttributes<HTMLDivElement> {
  columns?: GridColumns;
  gap?: GridGap;
}

export function Grid(props: GridProps) {
  const [local, others] = splitProps(props, [
    "columns",
    "gap",
    "children",
    "class",
  ]);

  const columns = () => local.columns ?? "1";
  const gap = () => local.gap ?? "4";

  // eslint-disable-next-line no-unused-expressions
  css`
    .ds-grid {
      display: grid;
    }

    /* Columns */
    .ds-grid--cols-1 {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }

    .ds-grid--cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .ds-grid--cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .ds-grid--cols-4 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .ds-grid--cols-6 {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }

    .ds-grid--cols-12 {
      grid-template-columns: repeat(12, minmax(0, 1fr));
    }

    /* Gap */
    .ds-grid--gap-0 {
      gap: var(--spacing-0);
    }

    .ds-grid--gap-1 {
      gap: var(--spacing-1);
    }

    .ds-grid--gap-2 {
      gap: var(--spacing-2);
    }

    .ds-grid--gap-3 {
      gap: var(--spacing-3);
    }

    .ds-grid--gap-4 {
      gap: var(--spacing-4);
    }

    .ds-grid--gap-5 {
      gap: var(--spacing-5);
    }

    .ds-grid--gap-6 {
      gap: var(--spacing-6);
    }

    .ds-grid--gap-8 {
      gap: var(--spacing-8);
    }

    .ds-grid--gap-10 {
      gap: var(--spacing-10);
    }

    .ds-grid--gap-12 {
      gap: var(--spacing-12);
    }
  `;

  const classes = () => {
    const classList: string[] = ["ds-grid"];
    classList.push(`ds-grid--cols-${columns()}`);
    classList.push(`ds-grid--gap-${gap()}`);
    if (local.class) classList.push(local.class);
    return classList.join(" ");
  };

  return (
    <div class={classes()} {...others}>
      {local.children}
    </div>
  );
}
