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

// The step delete button sits behind the step row (z-index:1, opaque
// background) and is only revealed by a touch swipe. On a desktop pointer
// that makes it invisible and unreachable. These tests assert that a real
// pointer / touch can actually reach and use the button.

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

test.describe('Step swipe + tap — mobile touch', () => {
  test.skip(({ hasTouch, browserName }) => !hasTouch || browserName !== 'chromium',
    'Skipped: requires chromium with touch emulation');

  let recipeId: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    recipeId = await createRecipeViaApi(page, SAMPLE_RECIPE);
    await page.goto(`/recipe/${recipeId}/edit`);
    await expect(page.locator('.step-swipe-wrap')).toHaveCount(3, { timeout: 8000 });
  });

  test('swiping the row left exposes the button and a tap deletes the step', async ({ page }) => {
    const wrap = page.locator('.step-swipe-wrap').first();
    const row = wrap.locator('.step-row');
    await row.scrollIntoViewIfNeeded();

    // Real touch swipe via CDP — page.mouse events do not fire touch handlers
    const cdp = await page.context().newCDPSession(page);
    const { startX, endX, y } = await page.evaluate(() => {
      const r = document.querySelector('.step-swipe-wrap .step-row')!.getBoundingClientRect();
      return { startX: r.left + r.width - 10, endX: r.left + 10, y: r.top + r.height / 2 };
    });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y }] });
    for (let i = 1; i <= 10; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: startX + ((endX - startX) * i) / 10, y }] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: endX, y }] });

    // The app must have translated the row to reveal the button
    await expect
      .poll(async () => page.evaluate(() => document.querySelector('.step-swipe-wrap .step-row')!.style.transform))
      .toBe('translateX(-80px)');

    const delBtn = wrap.locator('.ing-swipe-delete');
    const top = await delBtn.evaluate((btn) => {
      const r = btn.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return hit === btn || btn.contains(hit) ? 'button' : hit ? hit.className : 'none';
    });
    expect(top, 'button should be the topmost element at its position after the swipe').toBe('button');

    // A real touch tap must hit the now-exposed button and delete the step
    await delBtn.tap();
    await expect(page.locator('.step-swipe-wrap')).toHaveCount(2);
    const nums = await page.locator('.step-num').allTextContents();
    expect(nums).toEqual(['01', '02']);
  });
});
