import { Show, createSignal } from "solid-js";
import { css } from "solid-styled";
import { reviewDB } from "../scheduler/db";
import { schedulerSettingsSig, setSchedulerSettingsSig, initializeReviewQueue, cardsSig } from "../stores";
import type { SchedulerSettings } from "../scheduler/types";

export function SchedulerSettingsModal(props: { isOpen: boolean; onClose: () => void }) {
  const [settings, setSettings] = createSignal<SchedulerSettings>(schedulerSettingsSig());

  // eslint-disable-next-line no-unused-expressions
  css`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--color-overlay);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--z-index-modal);
    }

    .modal-content {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--spacing-8);
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-6);
      border-bottom: 1px solid var(--color-border);
      padding-bottom: var(--spacing-4);
    }

    .modal-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-semibold);
    }

    .close-button {
      background: none;
      border: none;
      font-size: var(--font-size-2xl);
      cursor: pointer;
      color: var(--color-text-secondary);
      transition: var(--transition-opacity);
    }

    .close-button:hover {
      color: var(--color-text-primary);
    }

    .form-section {
      margin-bottom: var(--spacing-6);
    }

    .section-title {
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
      margin-bottom: var(--spacing-3);
    }

    .form-group {
      margin-bottom: var(--spacing-4);
    }

    .form-label {
      display: block;
      margin-bottom: var(--spacing-2);
      font-weight: var(--font-weight-medium);
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
    }

    .form-input,
    .form-select {
      width: 100%;
      padding: var(--spacing-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface-elevated);
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      transition: var(--transition-colors);
    }

    .form-input:focus,
    .form-select:focus {
      outline: none;
      border-color: var(--color-border-focus);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .help-text {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      margin-top: var(--spacing-1);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-3);
      margin-top: var(--spacing-6);
      padding-top: var(--spacing-4);
      border-top: 1px solid var(--color-border);
    }

    .button {
      padding: var(--spacing-2) var(--spacing-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      transition: var(--transition-all);
    }

    .button-primary {
      background: var(--color-primary-500);
      color: white;
      border-color: var(--color-primary-500);
    }

    .button-primary:hover {
      background: var(--color-primary-600);
      border-color: var(--color-primary-600);
    }

    .button-secondary {
      background: transparent;
      color: var(--color-text-primary);
    }

    .button-secondary:hover {
      background: var(--color-surface-elevated);
    }
  `;

  const handleSave = async () => {
    const newSettings = settings();
    setSchedulerSettingsSig(newSettings);

    // Save to database
    const cards = cardsSig();
    if (cards.length > 0) {
      const deckId = `deck-${cards.length}`;
      await reviewDB.saveSettings(deckId, newSettings);

      // Reinitialize queue if settings changed
      await initializeReviewQueue();
    }

    props.onClose();
  };

  const updateSetting = <K extends keyof SchedulerSettings>(
    key: K,
    value: SchedulerSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateFsrsParam = <K extends keyof NonNullable<SchedulerSettings["fsrsParams"]>>(
    key: K,
    value: NonNullable<SchedulerSettings["fsrsParams"]>[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      fsrsParams: {
        ...prev.fsrsParams,
        [key]: value,
      },
    }));
  };

  return (
    <Show when={props.isOpen}>
      <div class="modal-overlay" onClick={props.onClose}>
        <div class="modal-content" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <div class="modal-title">Scheduler Settings</div>
            <button class="close-button" onClick={props.onClose}>
              ×
            </button>
          </div>

          <div class="form-section">
            <div class="section-title">Algorithm</div>
            <div class="form-group">
              <label class="form-label">Scheduling Algorithm</label>
              <select
                class="form-select"
                value={settings().algorithm}
                onChange={(e) =>
                  updateSetting("algorithm", e.currentTarget.value as "sm2" | "fsrs")
                }
              >
                <option value="sm2">SM-2 (Classic)</option>
                <option value="fsrs">FSRS (Modern)</option>
              </select>
              <div class="help-text">
                {settings().algorithm === "sm2"
                  ? "SM-2: Classic spaced repetition algorithm"
                  : "FSRS: Modern algorithm with improved scheduling accuracy"}
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="section-title">Daily Limits</div>
            <div class="form-group">
              <label class="form-label">New Cards per Day</label>
              <input
                type="number"
                class="form-input"
                value={settings().dailyNewLimit}
                min="0"
                max="999"
                onChange={(e) =>
                  updateSetting("dailyNewLimit", parseInt(e.currentTarget.value, 10))
                }
              />
            </div>
            <div class="form-group">
              <label class="form-label">Reviews per Day</label>
              <input
                type="number"
                class="form-input"
                value={settings().dailyReviewLimit}
                min="0"
                max="9999"
                onChange={(e) =>
                  updateSetting("dailyReviewLimit", parseInt(e.currentTarget.value, 10))
                }
              />
            </div>
          </div>

          <Show when={settings().algorithm === "fsrs"}>
            <div class="form-section">
              <div class="section-title">FSRS Parameters</div>
              <div class="form-group">
                <label class="form-label">Target Retention (0-1)</label>
                <input
                  type="number"
                  class="form-input"
                  value={settings().fsrsParams?.requestRetention ?? 0.9}
                  min="0"
                  max="1"
                  step="0.01"
                  onChange={(e) =>
                    updateFsrsParam("requestRetention", parseFloat(e.currentTarget.value))
                  }
                />
                <div class="help-text">
                  How much you want to remember (0.9 = 90% retention recommended)
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Maximum Interval (days)</label>
                <input
                  type="number"
                  class="form-input"
                  value={settings().fsrsParams?.maximumInterval ?? 36500}
                  min="1"
                  max="36500"
                  onChange={(e) =>
                    updateFsrsParam("maximumInterval", parseInt(e.currentTarget.value, 10))
                  }
                />
                <div class="help-text">
                  Maximum days between reviews (36500 = 100 years default)
                </div>
              </div>
            </div>
          </Show>

          <div class="modal-footer">
            <button class="button button-secondary" onClick={props.onClose}>
              Cancel
            </button>
            <button class="button button-primary" onClick={handleSave}>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
