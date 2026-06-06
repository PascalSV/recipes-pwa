import { test, expect } from '@playwright/test';
import { login, createRecipeViaApi } from './helpers.ts';

const SAMPLE_RECIPE = {
  name: 'Testgulasch',
  group: 'Fleisch',
  defaultPortions: 4,
  cookingTime: 90,
  ingredients: [
    { amount: 600, unit: 'g', name: 'Rindfleisch' },
    { amount: 2, name: 'Zwiebeln' },
    { amount: 1, unit: 'tbsp', name: 'Paprikapulver' },
  ],
  procedure: [
    'Fleisch würfeln und anbraten.',
    'Zwiebeln glasig dünsten.',
  ],
};

test.describe('Edit Recipe', () => {
  let recipeId: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    recipeId = await createRecipeViaApi(page, SAMPLE_RECIPE);
  });

  test('edit page is reachable from detail page', async ({ page }) => {
    await page.goto(`/recipe/${recipeId}`);
    await expect(page.locator(`a[href="/recipe/${recipeId}/edit"]`)).toBeVisible();
    await page.click(`a[href="/recipe/${recipeId}/edit"]`);
    await expect(page).toHaveURL(`/recipe/${recipeId}/edit`);
  });

  test('edit form shows recipe name', async ({ page }) => {
    await page.goto(`/recipe/${recipeId}/edit`);
    await expect(page.locator('#recipe-name')).toHaveValue(SAMPLE_RECIPE.name);
  });

  test('edit form shows correct portions', async ({ page }) => {
    await page.goto(`/recipe/${recipeId}/edit`);
    await expect(page.locator('#recipe-portions')).toHaveValue(String(SAMPLE_RECIPE.defaultPortions));
  });

  test('edit form shows cooking time', async ({ page }) => {
    await page.goto(`/recipe/${recipeId}/edit`);
    await expect(page.locator('#recipe-time')).toHaveValue(String(SAMPLE_RECIPE.cookingTime));
  });

  test('edit form populates all ingredients', async ({ page }) => {
    await page.goto(`/recipe/${recipeId}/edit`);
    // Wait for API fetch to complete and rows to appear
    await expect(page.locator('.ing-editor-row')).toHaveCount(SAMPLE_RECIPE.ingredients.length, { timeout: 8000 });
  });

  test('edit form shows ingredient names correctly', async ({ page }) => {
    await page.goto(`/recipe/${recipeId}/edit`);
    await expect(page.locator('.ing-editor-row')).toHaveCount(3, { timeout: 8000 });
    const names = await page.locator('.ing-editor-row .ing-name').evaluateAll(
      (els: HTMLInputElement[]) => els.map(el => el.value)
    );
    expect(names).toEqual(['Rindfleisch', 'Zwiebeln', 'Paprikapulver']);
  });

  test('edit form populates all procedure steps', async ({ page }) => {
    await page.goto(`/recipe/${recipeId}/edit`);
    await expect(page.locator('.step-input')).toHaveCount(SAMPLE_RECIPE.procedure.length, { timeout: 8000 });
  });

  test('editing and saving updates the recipe', async ({ page }) => {
    await page.goto(`/recipe/${recipeId}/edit`);
    // Wait for ingredients to load
    await expect(page.locator('.ing-editor-row')).toHaveCount(3, { timeout: 8000 });

    // Change the recipe name
    await page.fill('#recipe-name', 'Testgulasch Spezial');
    await page.click('#save-btn');

    // Should redirect back to detail page
    await expect(page).toHaveURL(`/recipe/${recipeId}`);
    await expect(page.locator('.nav-title')).toContainText('Testgulasch Spezial');
  });

  test('paste phase is hidden on edit page', async ({ page }) => {
    await page.goto(`/recipe/${recipeId}/edit`);
    await expect(page.locator('#paste-phase')).toBeHidden();
  });

  test('form phase is visible immediately on edit page', async ({ page }) => {
    await page.goto(`/recipe/${recipeId}/edit`);
    await expect(page.locator('#form-phase')).toBeVisible();
  });
});
