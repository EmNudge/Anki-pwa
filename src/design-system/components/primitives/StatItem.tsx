import { JSX, splitProps } from "solid-js";
import { css } from "solid-styled";

export interface StatItemProps extends JSX.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number | JSX.Element;
}

export function StatItem(props: StatItemProps) {
  const [local, others] = splitProps(props, ["label", "value", "class"]);

  // eslint-disable-next-line no-unused-expressions
  css`
    .ds-stat-item {
      display: flex;
      justify-content: space-between;
      padding: var(--spacing-3);
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
    }

    .ds-stat-label {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }

    .ds-stat-value {
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
    }
  `;

  const classes = () => ["ds-stat-item", local.class].filter(Boolean).join(" ");

  return (
    <div class={classes()} {...others}>
      <div class="ds-stat-label">{local.label}</div>
      <div class="ds-stat-value">{local.value}</div>
    </div>
  );
}
