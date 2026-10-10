import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { login, createRecipeViaApi } from './helpers.ts';

const SAMPLE_RECIPE = {
  name: 'PDF-Share-Test',
  group: 'Sonstiges',
  defaultPortions: 2,
  cookingTime: 15,
  ingredients: [
    { amount: 100, unit: 'g', name: 'Mehl' },
    { amount: 2, unit: 'piece', name: 'Ei' },
  ],
  procedure: [
    'Mehl und Ei mischen.',
    '30 Minuten backen.',
  ],
};

// The detail-page share button used to open a useless "copy link" sheet. It now
// directly exports the recipe as a PDF. These tests lock in that behavior.
test.describe('Detail page share button — direct PDF export', () => {
  let recipeId: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    recipeId = await createRecipeViaApi(page, SAMPLE_RECIPE);
  });

  test('clicking the share button produces a valid PDF download', async ({ page }) => {
    // Force the download path on every platform by disabling the Web Share API,
    // so the button deterministically downloads a file instead of opening a
    // native share sheet (which cannot be asserted in an automated browser).
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'canShare', {
        configurable: true,
        writable: true,
        value: () => false,
      });
    });

    await page.goto(`/recipe/${recipeId}`);
    await expect(page.locator('button.nav-btn')).toBeVisible({ timeout: 8000 });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button.nav-btn'),
    ]);

    expect(download.suggestedFilename()).toBe('pdf-share-test.pdf');

    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const header = readFileSync(filePath!).subarray(0, 5).toString();
    expect(header).toBe('%PDF-');
  });
});
