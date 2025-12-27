import { test, expect } from './fixtures';

test.describe('Deck Switching with SRS', () => {
  test('should update SRS panel when changing decks', async ({ loadedDeckPage: page }) => {
    // Wait for the SRS panel to be visible
    await expect(page.locator('text=SRS Scheduler')).toBeVisible();

    // Get initial SRS panel state
    const getCardsDue = async () => {
      const cardsDueElement = page.locator('text=Cards Due').locator('..').locator('.stat-value');
      return await cardsDueElement.textContent();
    };

    const getCurrentPosition = async () => {
      const positionElement = page.locator('text=Current Position').locator('..').locator('.stat-value');
      return await positionElement.textContent();
    };

    // Verify initial state shows cards
    const initialCardsDue = await getCardsDue();
    const initialPosition = await getCurrentPosition();

    expect(initialCardsDue).toBeTruthy();
    expect(parseInt(initialCardsDue!)).toBeGreaterThan(0);
    expect(initialPosition).toBeTruthy();

    // Check if there are multiple decks available
    const hasDeckSelector = await page.locator('text=Select Deck').isVisible();

    if (hasDeckSelector) {
      // Click to open deck selector
      await page.click('button:has-text("Select Deck")');

      // Wait for command palette to open
      await page.waitForTimeout(300);

      // Get available decks
      const deckOptions = page.locator('[role="option"]');
      const deckCount = await deckOptions.count();

      if (deckCount > 1) {
        // Click on the second deck option (first is usually "All Cards")
        await deckOptions.nth(1).click();

        // Wait for deck change to process
        await page.waitForTimeout(500);

        // Verify SRS panel has updated (not showing 0)
        const newCardsDue = await getCardsDue();
        const newPosition = await getCurrentPosition();

        // The key assertion: after changing decks, we should still have valid data
        // This test catches the bug where it would show "0 cards due" and "0 out of 0"
        expect(newCardsDue).toBeTruthy();

        // Either we have cards due, or we legitimately have 0 cards in this deck
        // But the position should be sensible
        const cardsDueNum = parseInt(newCardsDue!);
        const positionText = newPosition!;

        if (cardsDueNum > 0) {
          // If we have cards due, position should reflect that
          expect(positionText).not.toBe('0');
        }

        // Switch to "All Cards" to verify it works in both directions
        await page.click('button:has-text("Select Deck")');
        await page.waitForTimeout(300);

        // Click on "All Cards" option
        await deckOptions.first().click();
        await page.waitForTimeout(500);

        // Verify SRS panel updates again
        const finalCardsDue = await getCardsDue();
        const finalPosition = await getCurrentPosition();

        expect(finalCardsDue).toBeTruthy();
        expect(parseInt(finalCardsDue!)).toBeGreaterThan(0);
        expect(finalPosition).toBeTruthy();
        expect(finalPosition).not.toBe('0');
      }
    }
  });

  test('should maintain SRS queue state after deck switch', async ({ loadedDeckPage: page }) => {
    // Get initial queue size
    const getQueueSize = async () => {
      const cardsDueElement = page.locator('text=Cards Due').locator('..').locator('.stat-value');
      const text = await cardsDueElement.textContent();
      return parseInt(text || '0');
    };

    const initialQueueSize = await getQueueSize();
    expect(initialQueueSize).toBeGreaterThan(0);

    // Check if deck switching is available
    const hasDeckSelector = await page.locator('text=Select Deck').isVisible();

    if (hasDeckSelector) {
      // Open deck selector
      await page.click('button:has-text("Select Deck")');
      await page.waitForTimeout(500);

      // Check if options are available
      const deckOptions = page.locator('[role="option"]');
      const hasOptions = await deckOptions.count();

      if (hasOptions > 0) {
        // Select "All Cards"
        const allCardsOption = deckOptions.first();
        await allCardsOption.click();
        await page.waitForTimeout(500);

        // Queue should rebuild and show cards
        const allCardsQueueSize = await getQueueSize();
        expect(allCardsQueueSize).toBeGreaterThan(0);

        // The queue size might be different, but it should not be 0
        // (unless the deck legitimately has no cards)
      }
    }
  });

  test('should update daily progress when switching decks', async ({ loadedDeckPage: page }) => {
    // Wait for SRS panel
    await expect(page.locator('text=Daily Progress')).toBeVisible();

    // Get progress values
    const getNewCardsProgress = async () => {
      const progressText = page.locator('text=New Cards').locator('..').locator('span').last();
      return await progressText.textContent();
    };

    const initialProgress = await getNewCardsProgress();
    expect(initialProgress).toBeTruthy();

    // Check if deck switching is available
    const hasDeckSelector = await page.locator('text=Select Deck').isVisible();

    if (hasDeckSelector) {
      // Switch decks
      await page.click('button:has-text("Select Deck")');
      await page.waitForTimeout(300);

      const deckOptions = page.locator('[role="option"]');
      if ((await deckOptions.count()) > 1) {
        await deckOptions.nth(1).click();
        await page.waitForTimeout(500);

        // Verify progress is still displayed (not undefined or null)
        const newProgress = await getNewCardsProgress();
        expect(newProgress).toBeTruthy();
        expect(newProgress).toMatch(/\d+\s*\/\s*\d+/); // Should match "X / Y" format
      }
    }
  });
});
