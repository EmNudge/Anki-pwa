import { JSX, splitProps } from "solid-js";
import { css } from "solid-styled";

export interface LabelProps extends JSX.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label(props: LabelProps) {
  const [local, others] = splitProps(props, ["required", "children", "class"]);

  // eslint-disable-next-line no-unused-expressions
  css`
    .ds-label {
      display: inline-block;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      line-height: var(--line-height-normal);
    }

    .ds-label-required {
      color: var(--color-error-500);
      margin-left: var(--spacing-1);
    }
  `;

  const classes = () => {
    const classList: string[] = ["ds-label"];
    if (local.class) classList.push(local.class);
    return classList.join(" ");
  };

  return (
    <label class={classes()} {...others}>
      {local.children}
      {local.required && <span class="ds-label-required">*</span>}
    </label>
  );
}
