import { createSignal, Show } from "solid-js";
import { css } from "solid-styled";
import { reviewDB } from "../scheduler/db";
import { schedulerSettingsSig, setSchedulerSettingsSig, initializeReviewQueue, cardsSig } from "../stores";
import type { SchedulerSettings } from "../scheduler/types";
import { Button, Modal } from "../design-system";

export function SchedulerSettingsModal(props: { isOpen: boolean; onClose: () => void }) {
  const [settings, setSettings] = createSignal<SchedulerSettings>(schedulerSettingsSig());

  // eslint-disable-next-line no-unused-expressions
  css`
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
    <Modal
      title="Scheduler Settings"
      isOpen={props.isOpen}
      onClose={props.onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={props.onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Settings
          </Button>
        </>
      }
    >
      <>
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
      </>
    </Modal>
  );
}
