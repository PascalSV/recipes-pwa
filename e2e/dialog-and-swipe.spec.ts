import { test, expect } from '@playwright/test';
import { login, createRecipeViaApi } from './helpers.ts';

const SAMPLE_RECIPE = {
  name: 'Dialog Testrezept',
  group: 'Sonstiges',
  defaultPortions: 2,
  cookingTime: 30,
  ingredients: [
    { amount: 200, unit: 'g', name: 'Mehl' },
    { amount: 100, unit: 'ml', name: 'Wasser' },
  ],
  procedure: [
    'Mehl und Wasser vermischen.',
    'Teig kneten.',
    'Backen.',
  ],
};

test.describe('Delete confirmation dialog', () => {
  let recipeId: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    recipeId = await createRecipeViaApi(page, SAMPLE_RECIPE);
    await page.goto(`/recipe/${recipeId}/edit`);
    // Wait for form to be fully populated via API fetch
    await expect(page.locator('.ing-editor-row')).toHaveCount(2, { timeout: 8000 });
  });

  test('delete button triggers visible dialog overlay and sheet', async ({ page }) => {
    await page.click('button.nav-btn-danger');
    // Both overlay and sheet must be present in DOM
    await expect(page.locator('.dialog-overlay')).toBeAttached();
    await expect(page.locator('.dialog-sheet')).toBeAttached();
    // Sheet must be visible (this is what was broken)
    await expect(page.locator('.dialog-sheet')).toBeVisible();
    await expect(page.locator('.dialog-title')).toContainText('löschen');
  });

  test('cancel button (Abbrechen) in dialog dismisses it', async ({ page }) => {
    await page.click('button.nav-btn-danger');
    await expect(page.locator('.dialog-sheet')).toBeVisible();
    await page.click('.dialog-action-cancel');
    await expect(page.locator('.dialog-sheet')).not.toBeAttached();
    await expect(page.locator('.dialog-overlay')).not.toBeAttached();
    // Still on edit page
    await expect(page).toHaveURL(`/recipe/${recipeId}/edit`);
  });

  test('clicking overlay outside sheet dismisses dialog', async ({ page }) => {
    await page.click('button.nav-btn-danger');
    await expect(page.locator('.dialog-sheet')).toBeVisible();
    // Click top-left corner — overlay area, not the sheet at the bottom
    await page.mouse.click(10, 10);
    await expect(page.locator('.dialog-sheet')).not.toBeAttached();
  });

  test('confirm delete (danger button) deletes recipe and redirects', async ({ page }) => {
    await page.click('button.nav-btn-danger');
    await expect(page.locator('.dialog-sheet')).toBeVisible();
    await page.click('.dialog-action-danger');
    await expect(page).toHaveURL('/', { timeout: 8000 });
    // Verify via API that the specific recipe is gone
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const res = await page.request.get(`/api/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(404);
  });

  test('discard-changes dialog appears when clicking Cancel nav button', async ({ page }) => {
    // Trigger the cancel (discard) dialog
    await page.click('button.nav-btn:not(.nav-btn-danger)');
    await expect(page.locator('.dialog-sheet')).toBeVisible();
    await expect(page.locator('.dialog-title')).toContainText('Änderungen');
  });

  test('discard confirm navigates to detail page', async ({ page }) => {
    await page.click('button.nav-btn:not(.nav-btn-danger)');
    await expect(page.locator('.dialog-sheet')).toBeVisible();
    // Confirm discard
    await page.click('.dialog-action-danger');
    await expect(page).toHaveURL(`/recipe/${recipeId}`, { timeout: 8000 });
  });
});

test.describe('Step swipe-to-delete', () => {
  let recipeId: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    recipeId = await createRecipeViaApi(page, SAMPLE_RECIPE);
    await page.goto(`/recipe/${recipeId}/edit`);
    await expect(page.locator('.step-swipe-wrap')).toHaveCount(3, { timeout: 8000 });
  });

  test('steps render inside swipe wrappers', async ({ page }) => {
    await expect(page.locator('.step-swipe-wrap')).toHaveCount(3);
    // Each wrap must contain a step-row and a delete button
    await expect(page.locator('.step-swipe-wrap .step-row')).toHaveCount(3);
    await expect(page.locator('.step-swipe-wrap .ing-swipe-delete')).toHaveCount(3);
  });

  test('step numbers are zero-padded (01, 02, 03)', async ({ page }) => {
    const nums = await page.locator('.step-num').allTextContents();
    expect(nums).toEqual(['01', '02', '03']);
  });

  test('clicking delete button (via evaluate) removes step and renumbers', async ({ page }) => {
    // The delete button is hidden behind the step-row (z-index:1), so use evaluate
    // to fire the click event directly on the DOM element
    await page.evaluate(() => {
      const btn = document.querySelector('.step-swipe-wrap .ing-swipe-delete') as HTMLButtonElement;
      if (btn) btn.click();
    });
    await expect(page.locator('.step-swipe-wrap')).toHaveCount(2);
    const nums = await page.locator('.step-num').allTextContents();
    expect(nums).toEqual(['01', '02']);
  });

  test('adding a step appends a new swipe wrap', async ({ page }) => {
    await page.click('button[onclick="addStep()"]');
    await expect(page.locator('.step-swipe-wrap')).toHaveCount(4);
    const nums = await page.locator('.step-num').allTextContents();
    expect(nums[3]).toBe('04');
  });
});

// Touch swipe tests — only run when touch is available (mobile project)
test.describe('Step swipe gesture (mobile)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium' || !process.env.PLAYWRIGHT_MOBILE,
    'Skipped: touch swipe only tested on mobile project');

  let recipeId: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    recipeId = await createRecipeViaApi(page, SAMPLE_RECIPE);
    await page.goto(`/recipe/${recipeId}/edit`);
    await expect(page.locator('.step-swipe-wrap')).toHaveCount(3, { timeout: 8000 });
  });

  test('swipe left on step row reveals delete button', async ({ page }) => {
    const row = page.locator('.step-swipe-wrap').first().locator('.step-row');
    const box = await row.boundingBox();
    if (!box) throw new Error('step-row not found');

    const startX = box.x + box.width - 10;
    const endX = box.x + 10;
    const y = box.y + box.height / 2;

    // Simulate swipe via touch events
    await page.touchscreen.tap(startX, y);
    await page.waitForTimeout(50);
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(endX, y, { steps: 10 });
    await page.mouse.up();

    // After swipe, the delete button should be visible
    const delBtn = page.locator('.step-swipe-wrap').first().locator('.ing-swipe-delete');
    await expect(delBtn).toBeVisible({ timeout: 2000 });
  });
});
