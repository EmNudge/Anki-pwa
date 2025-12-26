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
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: var(--surface-color-01);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
    }

    .modal-title {
      font-size: 1.5rem;
      font-weight: 600;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .close-button:hover {
      opacity: 1;
    }

    .form-section {
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-weight: 600;
      font-size: 0.9rem;
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .form-input,
    .form-select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: var(--surface-color-02);
      font-size: 0.875rem;
    }

    .form-input:focus,
    .form-select:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .help-text {
      font-size: 0.75rem;
      opacity: 0.6;
      margin-top: 0.25rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .button {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .button-primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .button-primary:hover {
      background: #2563eb;
      border-color: #2563eb;
    }

    .button-secondary {
      background: transparent;
    }

    .button-secondary:hover {
      background: var(--surface-color-02);
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
