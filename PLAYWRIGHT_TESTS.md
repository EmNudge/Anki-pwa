# Playwright E2E Test Suite

A comprehensive Playwright test suite has been created for the Anki PWA project.

## Summary

The test suite includes **22 tests** across **3 test files**, covering major application features:

### Test Files

1. **`e2e/card-display.spec.ts`** (7 tests)
   - Verifies cards display with front side initially
   - Tests reveal functionality
   - Validates front/back content display
   - Tests card navigation between reviews

2. **`e2e/srs-algorithm.spec.ts`** (6 tests)
   - Validates SM-2 spaced repetition algorithm
   - Tests interval calculations for different answer ratings
   - Verifies persistence to IndexedDB
   - Checks review log tracking
   - Validates daily statistics

3. **`e2e/keyboard-shortcuts.spec.ts`** (9 tests)
   - Tests Space key for revealing cards
   - Tests a/h/g/e keys for answering (Again/Hard/Good/Easy)
   - Validates keyboard-only review flow
   - Tests key scoping (keys work only on appropriate card sides)
   - Tests rapid keyboard navigation

### Supporting Files

- **`e2e/fixtures.ts`**: Test utilities and fixtures
  - `loadAnkiDeck()`: Loads test deck file
  - `clearReviewData()`: Clears IndexedDB
  - `clearDeckCache()`: Clears cache
  - `loadedDeckPage`: Fixture providing pre-loaded deck

- **`e2e/README.md`**: Documentation for the test suite

- **`playwright.config.ts`**: Playwright configuration
  - Configured for Chromium browser
  - Auto-starts dev server
  - Generates HTML reports

## Running Tests

```bash
# Run all e2e tests (headless)
npm run test:e2e

# Run with Playwright UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug
```

## Test Coverage

The test suite covers:

✅ **Card Front/Back Display**
- Cards properly show front side first
- Reveal button functionality
- Back side displays answer content
- Content structure and layout

✅ **SRS Algorithm (SM-2)**
- Interval calculation for all answer types (Again, Hard, Good, Easy)
- Different intervals based on answer difficulty
- State persistence to IndexedDB
- Review logging
- Daily statistics tracking

✅ **Keyboard Navigation**
- Space: Reveal card
- 'a': Answer Again (rating 0)
- 'h': Answer Hard (rating 3)
- 'g': Answer Good (rating 4)
- 'e': Answer Easy (rating 5)
- Full keyboard-only workflow
- Proper key scoping

✅ **Data Persistence**
- Review states saved to IndexedDB
- Review logs tracked
- Daily statistics recorded
- Settings persistence

## Implementation Notes

- Uses the real test deck: `src/ankiParser/__tests__/example_music_intervals.apkg`
- Tests verify both UI state and database operations
- Each test starts with a clean state (cleared DB and cache)
- Tests are isolated and can run in parallel
- Comprehensive keyboard accessibility testing

## Files Modified/Created

**Created:**
- `playwright.config.ts` - Playwright configuration
- `e2e/fixtures.ts` - Test utilities and fixtures
- `e2e/card-display.spec.ts` - Card display tests
- `e2e/srs-algorithm.spec.ts` - SRS algorithm tests
- `e2e/keyboard-shortcuts.spec.ts` - Keyboard shortcut tests
- `e2e/README.md` - Test documentation

**Modified:**
- `package.json` - Added Playwright scripts (test:e2e, test:e2e:ui, test:e2e:headed, test:e2e:debug)
- `.gitignore` - Added Playwright test results directories

## Next Steps

To extend the test suite, consider adding:
- Tests for file upload edge cases
- Tests for multiple deck formats (Anki2, Anki21b)
- Tests for media files in cards (images, audio)
- Tests for deck statistics visualization
- Tests for settings/configuration
- Mobile viewport testing
- Performance testing
- Accessibility testing (ARIA, screen readers)
