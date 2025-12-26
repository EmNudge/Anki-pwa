import { css } from "solid-styled";
import { deckInfoSig } from "../stores";
import { SidePanel } from "../design-system/components/layout/SidePanel";
import { StatItem } from "../design-system/components/primitives/StatItem";

export function DeckInfo() {
  // eslint-disable-next-line no-unused-expressions
  css`
    .deck-name {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      word-break: break-word;
    }
  `;

  const deckInfo = () => deckInfoSig();

  return (
    <SidePanel title="Deck Info" maxWidth="300px">
      <h3 class="deck-name">{deckInfo()?.name}</h3>
      <StatItem label="Cards" value={deckInfo()?.cardCount ?? 0} />
      <StatItem label="Templates" value={deckInfo()?.templateCount ?? 0} />
    </SidePanel>
  );
}
