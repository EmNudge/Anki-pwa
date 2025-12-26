import { Show, createMemo, createSignal } from "solid-js";
import { css } from "solid-styled";
import {
  currentReviewCardSig,
  dueCardsSig,
  reviewQueueSig,
  schedulerEnabledSig,
  schedulerSettingsSig,
} from "../stores";

export function SRSVisualization() {
  const [expanded, setExpanded] = createSignal(true);
  // eslint-disable-next-line no-unused-expressions
  css`
    .srs-container {
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      border-radius: var(--radius-sm);
      padding: var(--spacing-4);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4);
      max-width: 800px;
    }

    .srs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: var(--spacing-2);
      cursor: pointer;
      user-select: none;
    }

    .srs-header:hover {
      opacity: 0.8;
    }

    .srs-title {
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-lg);
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
    }

    .expand-icon {
      transition: var(--transition-transform);
      font-size: var(--font-size-sm);
    }

    .expand-icon.collapsed {
      transform: rotate(-90deg);
    }

    .status-badge {
      padding: var(--spacing-1) var(--spacing-3);
      border-radius: var(--radius-lg);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
    }

    .status-enabled {
      background: var(--color-success-500);
      color: white;
    }

    .status-disabled {
      background: var(--color-neutral-500);
      color: white;
    }

    .srs-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);
    }

    .section-title {
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: var(--spacing-3);
    }

    .stat-card {
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: var(--spacing-3);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1);
    }

    .stat-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
    }

    .stat-value {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
    }

    .stat-secondary {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .progress-bar-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1);
    }

    .progress-bar-label {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-sm);
    }

    .progress-bar-bg {
      width: 100%;
      height: var(--spacing-4);
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary-500), var(--color-primary-600));
      transition: width var(--duration-slow) var(--ease-out);
    }

    .progress-bar-fill.complete {
      background: linear-gradient(90deg, var(--color-success-500), var(--color-success-600));
    }

    .card-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-2);
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      padding: var(--spacing-2);
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
    }

    .info-label {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }

    .info-value {
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
    }

    .no-cards-message {
      text-align: center;
      padding: var(--spacing-8);
      color: var(--color-text-tertiary);
      font-style: italic;
    }
  `;

  const currentCard = () => currentReviewCardSig();
  const dueCards = () => dueCardsSig();
  const queue = () => reviewQueueSig();
  const settings = () => schedulerSettingsSig();
  const enabled = () => schedulerEnabledSig();

  // Calculate daily progress
  const dailyProgress = createMemo(() => {
    const q = queue();
    if (!q) return { newDone: 0, newLimit: 0, reviewsDone: 0, reviewsLimit: 0 };

    const limits = q.getRemainingLimits();
    const s = settings();

    return {
      newDone: s.dailyNewLimit - limits.newLeft,
      newLimit: s.dailyNewLimit,
      reviewsDone: s.dailyReviewLimit - limits.reviewsLeft,
      reviewsLimit: s.dailyReviewLimit,
    };
  });

  // Get display info from current card
  const cardState = createMemo(() => {
    const card = currentCard();
    const q = queue();
    if (!card || !q) return null;

    try {
      const displayInfo = q.getCardDisplayInfo(card);
      return {
        ...displayInfo,
        isNew: card.isNew,
        algorithm: card.reviewState.algorithm,
      };
    } catch (error) {
      console.error("Error getting card display info:", error);
      return null;
    }
  });

  return (
    <div class="srs-container">
      <div class="srs-header" onClick={() => setExpanded(!expanded())}>
        <div class="srs-title">
          <span class={expanded() ? "expand-icon" : "expand-icon collapsed"}>▼</span>
          SRS Scheduler
        </div>
        <div class={enabled() ? "status-badge status-enabled" : "status-badge status-disabled"}>
          {enabled() ? "Active" : "Disabled"}
        </div>
      </div>

      <Show when={expanded()}>
        <Show
          when={enabled()}
          fallback={
            <div class="no-cards-message">Enable the scheduler (Ctrl+R) to see statistics</div>
          }
        >
          {/* Queue Overview */}
          <div class="srs-section">
            <div class="section-title">Queue Overview</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Cards Due</div>
                <div class="stat-value">{dueCards().length}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Current Position</div>
                <div class="stat-value">
                  {currentCard()
                    ? dueCards().findIndex((c) => c.cardId === currentCard()?.cardId) + 1
                    : 0}
                </div>
                <div class="stat-secondary">of {dueCards().length}</div>
              </div>
            </div>
          </div>

          {/* Daily Progress */}
          <div class="srs-section">
            <div class="section-title">Daily Progress</div>
            <div style={{ display: "flex", "flex-direction": "column", gap: "var(--spacing-4)" }}>
              <div class="progress-bar-container">
                <div class="progress-bar-label">
                  <span>New Cards</span>
                  <span>
                    {dailyProgress().newDone} / {dailyProgress().newLimit}
                  </span>
                </div>
                <div class="progress-bar-bg">
                  <div
                    class={
                      dailyProgress().newDone >= dailyProgress().newLimit
                        ? "progress-bar-fill complete"
                        : "progress-bar-fill"
                    }
                    style={{
                      width: `${Math.min(100, (dailyProgress().newDone / dailyProgress().newLimit) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div class="progress-bar-container">
                <div class="progress-bar-label">
                  <span>Reviews</span>
                  <span>
                    {dailyProgress().reviewsDone} / {dailyProgress().reviewsLimit}
                  </span>
                </div>
                <div class="progress-bar-bg">
                  <div
                    class={
                      dailyProgress().reviewsDone >= dailyProgress().reviewsLimit
                        ? "progress-bar-fill complete"
                        : "progress-bar-fill"
                    }
                    style={{
                      width: `${Math.min(100, (dailyProgress().reviewsDone / dailyProgress().reviewsLimit) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Current Card State */}
          <Show when={cardState()}>
            {(state) => (
              <div class="srs-section">
                <div class="section-title">
                  Current Card State ({state().algorithm?.toUpperCase() || "SM2"})
                </div>
                <div class="card-info-grid">
                  <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value">{state().isNew ? "New" : "Review"}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Repetitions</div>
                    <div class="info-value">{state().repetitions || 0}</div>
                  </div>

                  {/* SM2-specific fields */}
                  <Show when={state().algorithm === "sm2"}>
                    <div class="info-item">
                      <div class="info-label">Ease Factor</div>
                      <div class="info-value">{(state().ease || 2.5).toFixed(2)}</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">Interval</div>
                      <div class="info-value">{(state().interval || 0).toFixed(1)}d</div>
                    </div>
                  </Show>

                  {/* FSRS-specific fields */}
                  <Show when={state().algorithm === "fsrs"}>
                    <div class="info-item">
                      <div class="info-label">Stability</div>
                      <div class="info-value">{(state().stability || 0).toFixed(2)}d</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">Difficulty</div>
                      <div class="info-value">{(state().difficulty || 0).toFixed(2)}</div>
                    </div>
                  </Show>

                  <div class="info-item">
                    <div class="info-label">Card ID</div>
                    <div class="info-value" style={{ "font-size": "0.7rem", opacity: 0.5 }}>
                      {currentCard()?.cardId.split(":").slice(-2).join(":")}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Show>

          <Show when={!currentCard() && dueCards().length === 0}>
            <div class="no-cards-message">🎉 All done for today! No more cards due.</div>
          </Show>
        </Show>
      </Show>
    </div>
  );
}
