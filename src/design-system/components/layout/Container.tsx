import { JSX, splitProps } from "solid-js";
import { css } from "solid-styled";

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ContainerProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  padding?: boolean;
}

export function Container(props: ContainerProps) {
  const [local, others] = splitProps(props, [
    "size",
    "padding",
    "children",
    "class",
  ]);

  const size = () => local.size ?? "lg";
  const padding = () => local.padding ?? true;

  // eslint-disable-next-line no-unused-expressions
  css`
    .ds-container {
      width: 100%;
      margin-left: auto;
      margin-right: auto;
    }

    .ds-container--padding {
      padding-left: var(--spacing-4);
      padding-right: var(--spacing-4);
    }

    /* Sizes */
    .ds-container--sm {
      max-width: 640px;
    }

    .ds-container--md {
      max-width: 768px;
    }

    .ds-container--lg {
      max-width: 1024px;
    }

    .ds-container--xl {
      max-width: 1280px;
    }

    .ds-container--full {
      max-width: 100%;
    }
  `;

  const classes = () => {
    const classList: string[] = ["ds-container"];
    classList.push(`ds-container--${size()}`);
    if (padding()) classList.push("ds-container--padding");
    if (local.class) classList.push(local.class);
    return classList.join(" ");
  };

  return (
    <div class={classes()} {...others}>
      {local.children}
    </div>
  );
}
