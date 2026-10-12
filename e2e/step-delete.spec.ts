import { test, expect } from '@playwright/test';
import { login, createRecipeViaApi } from './helpers.ts';

const SAMPLE_RECIPE = {
  name: 'Schritt-Lösch-Test',
  group: 'Sonstiges',
  defaultPortions: 2,
  cookingTime: 20,
  ingredients: [
    { amount: 1, unit: 'g', name: 'Mehl' },
  ],
  procedure: [
    'Erster Schritt.',
    'Zweiter Schritt.',
    'Dritter Schritt.',
  ],
};

// The step delete button is an always-visible × at the end of each row.
// These tests assert that a real pointer / touch can reach and use it.

test.describe('Step delete button — desktop pointer', () => {
  test.skip(({ hasTouch }) => !!hasTouch, 'Skipped: requires a desktop pointer, not a touch device');

  let recipeId: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    recipeId = await createRecipeViaApi(page, SAMPLE_RECIPE);
    await page.goto(`/recipe/${recipeId}/edit`);
    await expect(page.locator('.step-swipe-wrap')).toHaveCount(3, { timeout: 8000 });
  });

  test('every step row has a delete button in the DOM', async ({ page }) => {
    await expect(page.locator('.step-swipe-wrap .ing-swipe-delete')).toHaveCount(3);
  });

  test('delete buttons are exposed to the pointer, not covered by the row', async ({ page }) => {
    const covered = await page.locator('.step-swipe-wrap .ing-swipe-delete').evaluateAll((btns) =>
      btns
        .map((btn) => {
          btn.scrollIntoView({ block: 'center', behavior: 'instant' });
          const r = btn.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return 'zero-size';
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          if (!hit) return 'outside-viewport';
          if (hit === btn || btn.contains(hit)) return null;
          return hit.className || hit.tagName;
        })
        .filter((c): c is string => c !== null)
    );
    expect(covered, `delete buttons are not reachable (topmost: ${covered.join(', ')})`).toEqual([]);
  });

  test('a normal mouse click on the delete button removes the step and renumbers', async ({ page }) => {
    const btn = page.locator('.step-swipe-wrap .ing-swipe-delete').first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ timeout: 3000 });
    await expect(page.locator('.step-swipe-wrap')).toHaveCount(2);
    const nums = await page.locator('.step-num').allTextContents();
    expect(nums).toEqual(['01', '02']);
  });

  test('deleting a middle step and saving persists the removal', async ({ page }) => {
    const btn = page.locator('.step-swipe-wrap .ing-swipe-delete').nth(1);
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ timeout: 3000 });
    await page.click('#save-btn');
    await expect(page).toHaveURL(`/recipe/${recipeId}`);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const res = await page.request.get(`/api/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.procedure).toEqual(['Erster Schritt.', 'Dritter Schritt.']);
  });
});

test.describe('Step delete — mobile touch', () => {
  test.skip(({ hasTouch, browserName }) => !hasTouch || browserName !== 'chromium',
    'Skipped: requires chromium with touch emulation');

  let recipeId: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    recipeId = await createRecipeViaApi(page, SAMPLE_RECIPE);
    await page.goto(`/recipe/${recipeId}/edit`);
    await expect(page.locator('.step-swipe-wrap')).toHaveCount(3, { timeout: 8000 });
  });

  test('the always-visible button is tappable and deletes the step', async ({ page }) => {
    const delBtn = page.locator('.step-swipe-wrap .ing-swipe-delete').first();
    await delBtn.scrollIntoViewIfNeeded();
    await expect(delBtn).toBeVisible();

    // A real touch tap on the always-visible button must delete the step
    await delBtn.tap();
    await expect(page.locator('.step-swipe-wrap')).toHaveCount(2);
    const nums = await page.locator('.step-num').allTextContents();
    expect(nums).toEqual(['01', '02']);
  });
});
