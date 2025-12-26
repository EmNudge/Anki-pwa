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
      border: 1px solid var(--border-color);
      background: var(--surface-color-01);
      border-radius: 4px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 800px;
    }

    .srs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
      cursor: pointer;
      user-select: none;
    }

    .srs-header:hover {
      opacity: 0.8;
    }

    .srs-title {
      font-weight: 600;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .expand-icon {
      transition: transform 0.2s ease;
      font-size: 0.8rem;
    }

    .expand-icon.collapsed {
      transform: rotate(-90deg);
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-enabled {
      background: #10b981;
      color: white;
    }

    .status-disabled {
      background: #6b7280;
      color: white;
    }

    .srs-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .section-title {
      font-weight: 600;
      font-size: 0.9rem;
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.75rem;
    }

    .stat-card {
      background: var(--surface-color-02);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.75rem;
      opacity: 0.6;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .stat-secondary {
      font-size: 0.875rem;
      opacity: 0.7;
    }

    .progress-bar-container {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .progress-bar-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }

    .progress-bar-bg {
      width: 100%;
      height: 1rem;
      background: var(--surface-color-02);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #2563eb);
      transition: width 0.3s ease;
    }

    .progress-bar-fill.complete {
      background: linear-gradient(90deg, #10b981, #059669);
    }

    .card-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
      background: var(--surface-color-02);
      border: 1px solid var(--border-color);
      border-radius: 4px;
    }

    .info-label {
      opacity: 0.6;
      font-size: 0.875rem;
    }

    .info-value {
      font-weight: 600;
      font-size: 0.875rem;
    }

    .no-cards-message {
      text-align: center;
      padding: 2rem;
      opacity: 0.5;
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
            <div style={{ display: "flex", "flex-direction": "column", gap: "1rem" }}>
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
