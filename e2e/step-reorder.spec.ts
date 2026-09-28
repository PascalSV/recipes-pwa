import { test, expect, type Page } from '@playwright/test';
import { login, createRecipeViaApi } from './helpers.ts';

const SAMPLE_RECIPE = {
  name: 'Sortier-Test',
  group: 'Sonstiges',
  defaultPortions: 2,
  cookingTime: 20,
  ingredients: [
    { amount: 1, unit: 'g', name: 'Mehl' },
    { amount: 2, unit: 'tbsp', name: 'Oel' },
  ],
  procedure: [
    'Erster Schritt.',
    'Zweiter Schritt.',
    'Dritter Schritt.',
  ],
};

const REORDERED = ['Zweiter Schritt.', 'Dritter Schritt.', 'Erster Schritt.'];

function stepTexts(page: Page) {
  return page.locator('#steps-list .step-input').evaluateAll(
    (tas) => tas.map((t) => (t as HTMLTextAreaElement).value)
  );
}

/** Drag the grip of the first step past the bottom of the last step. */
async function dragFirstStepToBottom(page: Page) {
  const handle = page.locator('#steps-list .step-swipe-wrap').first().locator('.ing-drag-handle');
  const lastRow = page.locator('#steps-list .step-swipe-wrap').last().locator('.step-row');
  await handle.scrollIntoViewIfNeeded();
  const hb = (await handle.boundingBox())!;
  const lb = (await lastRow.boundingBox())!;
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb.x + hb.width / 2, lb.y + lb.height - 4, { steps: 20 });
  await page.mouse.up();
}

/** Drag the grip of the first ingredient past the bottom of the last ingredient in its section. */
async function dragFirstIngredientToBottom(page: Page) {
  const handle = page.locator('.ing-section-list').first().locator('.ing-swipe-wrap').first().locator('.ing-drag-handle');
  const lastRow = page.locator('.ing-section-list').first().locator('.ing-swipe-wrap').last().locator('.ing-editor-row');
  await handle.scrollIntoViewIfNeeded();
  const hb = (await handle.boundingBox())!;
  const lb = (await lastRow.boundingBox())!;
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb.x + hb.width / 2, lb.y + lb.height - 4, { steps: 20 });
  await page.mouse.up();
}

test.describe('Step drag reorder — desktop pointer', () => {
  test.skip(({ hasTouch }) => !!hasTouch, 'Skipped: requires a desktop pointer, not a touch device');

  let recipeId: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    recipeId = await createRecipeViaApi(page, SAMPLE_RECIPE);
    await page.goto(`/recipe/${recipeId}/edit`);
    await expect(page.locator('.step-swipe-wrap')).toHaveCount(3, { timeout: 8000 });
    // Let the app's async recipe fetch (+ SW precache) settle before acting,
    // so a late populateForm() can't rebuild the form mid-test.
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  });

  test('every step row has a drag handle', async ({ page }) => {
    await expect(page.locator('#steps-list .ing-drag-handle')).toHaveCount(3);
  });

  test('dragging the first step past the last reorders the list and renumbers', async ({ page }) => {
    await dragFirstStepToBottom(page);
    expect(await stepTexts(page)).toEqual(REORDERED);
    const nums = await page.locator('#steps-list .step-num').allTextContents();
    expect(nums).toEqual(['01', '02', '03']);
  });

  test('reordered steps persist after saving', async ({ page }) => {
    await dragFirstStepToBottom(page);
    // Verify the DOM before saving: if a late async populateForm() lands between the
    // drag and the click, this fails early with a clear signal instead of a silent
    // data-loss save (procedure: []).
    expect(await stepTexts(page)).toEqual(REORDERED);
    await page.click('#save-btn');
    await expect(page).toHaveURL(`/recipe/${recipeId}`);
    expect(await page.locator('.step-text').allTextContents()).toEqual(REORDERED);
  });

  test('reordering then pressing Back asks for confirmation', async ({ page }) => {
    await dragFirstStepToBottom(page);
    await page.click('.nav-left button');
    await expect(page.locator('.dialog-sheet')).toBeVisible();
    await page.click('.dialog-sheet .dialog-action-cancel');
    await expect(page).toHaveURL(`/recipe/${recipeId}/edit`);
    expect(await stepTexts(page)).toEqual(REORDERED);
  });

  test('ingredient drag still works after the step drag changes', async ({ page }) => {
    await dragFirstIngredientToBottom(page);
    const names = await page
      .locator('.ing-section-list')
      .first()
      .locator('.ing-name')
      .evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value));
    expect(names).toEqual(['Oel', 'Mehl']);
  });
});

test.describe('Step drag reorder — mobile touch', () => {
  test.skip(({ hasTouch, browserName }) => !hasTouch || browserName !== 'chromium',
    'Skipped: requires chromium with touch emulation');

  let recipeId: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    recipeId = await createRecipeViaApi(page, SAMPLE_RECIPE);
    await page.goto(`/recipe/${recipeId}/edit`);
    await expect(page.locator('.step-swipe-wrap')).toHaveCount(3, { timeout: 8000 });
    // Let the app's async recipe fetch (+ SW precache) settle before acting,
    // so a late populateForm() can't rebuild the form mid-test.
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  });

  test('touch-dragging the handle reorders the steps and renumbers', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    const { hx, hy, endX, endY } = await page.evaluate(() => {
      const wraps = Array.from(document.querySelectorAll('#steps-list .step-swipe-wrap'));
      const h = wraps[0]!.querySelector('.ing-drag-handle')!.getBoundingClientRect();
      const last = wraps[wraps.length - 1]!.querySelector('.step-row')!.getBoundingClientRect();
      return { hx: h.left + h.width / 2, hy: h.top + h.height / 2, endX: h.left + h.width / 2, endY: last.top + last.height - 4 };
    });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: hx, y: hy }] });
    for (let i = 1; i <= 15; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: endX, y: hy + ((endY - hy) * i) / 15 }] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: endX, y: endY }] });

    expect(await stepTexts(page)).toEqual(REORDERED);
    const nums = await page.locator('#steps-list .step-num').allTextContents();
    expect(nums).toEqual(['01', '02', '03']);
  });
});
