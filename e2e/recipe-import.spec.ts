import { test, expect } from '@playwright/test';
import { login } from './helpers.ts';

// Full Palocleves text — same text that exposed the 3-of-18 save bug.
// IMPORTANT: Keep the ingredient list complete so regressions are caught.
const PALOCLEVES_TEXT = `Palocleves (Ungarischer Eintopf) mit Lammfleisch
Gesamtzeit: 120 Minuten
Schwierigkeitsgrad: Mittel
Nährwerte pro Portion
kcal
525
Eiweiß
39,61 g
Kohlenhydrate
41,16 g
Zutaten
500 Gramm
Kartoffeln, festkochend
2
Zwiebeln
2
Knoblauchzehen
400 Gramm
Bohnen, grün
1 Esslöffel
Senfkörner
600 Gramm
Lammschulter
2 Esslöffel
Butterschmalz
2
Lorbeerblätter
2 - 3 Teelöffel
Mehl
1 - 2 Esslöffel
Zitronensaft
Dillspitzen für die Garnitur
Pfefferkörner, schwarz aus der Mühle
Paprikapulver
Salz
Zubereitung
Kartoffeln, Zwiebeln und Knoblauch schälen und würfeln. Das Fleisch anbraten.
Mit Paprikapulver würzen und ca. 1,5 Stunden köcheln lassen.
Mit Zitronensaft abschmecken und mit Dill bestreut servieren.`;

// Names expected in the detail view after a full save — covers both
// remark-parenthetical ingredients AND plain-name ingredients (the ones
// that were silently dropped by the bug).
const EXPECTED_NAMES = [
  'Kartoffeln',      // has remark — was "saved" even with the bug
  'Zwiebeln',        // PLAIN NAME — was dropped by the bug
  'Knoblauchzehen',  // PLAIN NAME — was dropped by the bug
  'Bohnen',          // has remark — was "saved" even with the bug
  'Lammschulter',    // PLAIN NAME — was dropped by the bug
  'Mehl',            // range amount, plain name — was dropped
  'Salz',            // amount=0, plain name — was dropped
  'Pfefferkörner',   // has remark — was "saved" even with the bug
];

test.describe('Recipe Import', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('new recipe page shows paste area initially', async ({ page }) => {
    await page.goto('/recipe/new');
    await expect(page.locator('#paste-phase')).toBeVisible();
    await expect(page.locator('#form-phase')).toBeHidden();
    await expect(page.locator('#parse-btn')).toBeDisabled();
  });

  test('extract button enables when text is pasted', async ({ page }) => {
    await page.goto('/recipe/new');
    await page.fill('#paste-input', 'some text');
    await expect(page.locator('#parse-btn')).toBeEnabled();
  });

  test('parsing Palocleves extracts recipe name', async ({ page }) => {
    await page.goto('/recipe/new');
    await page.fill('#paste-input', PALOCLEVES_TEXT);
    await page.click('#parse-btn');
    await expect(page.locator('#form-phase')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#recipe-name'))
      .toHaveValue('Palocleves (Ungarischer Eintopf) mit Lammfleisch', { timeout: 5000 });
  });

  test('parsing Palocleves extracts cooking time', async ({ page }) => {
    await page.goto('/recipe/new');
    await page.fill('#paste-input', PALOCLEVES_TEXT);
    await page.click('#parse-btn');
    await expect(page.locator('#form-phase')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#recipe-time')).toHaveValue('120');
  });

  test('form shows ingredient rows including nutritional noise filtered out', async ({ page }) => {
    await page.goto('/recipe/new');
    await page.fill('#paste-input', PALOCLEVES_TEXT);
    await page.click('#parse-btn');
    await expect(page.locator('#form-phase')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.ing-editor-row').first()).toBeVisible();
    const count = await page.locator('.ing-editor-row').count();
    // The 10 nutritional lines must NOT appear as ingredients
    expect(count).toBeGreaterThanOrEqual(8);
  });

  test('ingredient rows have data-ing-name attribute set (regression: collectIngredients fallback)', async ({ page }) => {
    await page.goto('/recipe/new');
    await page.fill('#paste-input', PALOCLEVES_TEXT);
    await page.click('#parse-btn');
    await expect(page.locator('#form-phase')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.ing-editor-row').first()).toBeVisible();

    // Every row must have data-ing-name set — this is the fallback that prevents
    // plain-name ingredients being silently dropped during save.
    const rows = page.locator('.ing-editor-row');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const attr = await rows.nth(i).getAttribute('data-ing-name');
      expect(attr, `Row ${i} is missing data-ing-name`).not.toBeNull();
      expect(attr!.trim(), `Row ${i} has empty data-ing-name`).not.toBe('');
    }
  });

  test('REGRESSION: all plain-name ingredients are saved, not just parenthetical ones', async ({ page }) => {
    // This test specifically guards against the bug where only ingredients whose
    // name field contained parentheses (e.g. "Kartoffeln (festkochend)") were
    // saved, while plain-name ingredients (e.g. "Zwiebeln") were silently dropped.
    await page.goto('/recipe/new');
    await page.fill('#paste-input', PALOCLEVES_TEXT);
    await page.click('#parse-btn');
    await expect(page.locator('#form-phase')).toBeVisible({ timeout: 15000 });

    // Fill in recipe name (required) and save
    await page.fill('#recipe-name', 'Palocleves Regression Test');
    await page.click('#save-btn');

    // Should land on the detail page
    await expect(page).toHaveURL(/\/recipe\/.[a-f0-9-]+$/, { timeout: 10000 });

    const recipeId = page.url().split('/recipe/')[1].split('?')[0];
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const apiRes = await page.request.get(`/api/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const savedRecipe = await apiRes.json();

    // Verify all expected ingredients are present
    for (const name of EXPECTED_NAMES) {
      expect(savedRecipe.ingredients.some((ing: { name: string }) => ing.name === name)).toBe(true);
    }
    await expect(page).toHaveURL(/\/recipe\/[a-f0-9-]+$/, { timeout: 10000 });

    // Verify all expected ingredient names appear in the detail view.
    // Both remark-parenthetical AND plain-name ingredients must be present.
    for (const name of EXPECTED_NAMES) {
      await expect(
        page.locator('.ing-name, .ing-free').filter({ hasText: name }),
        `Ingredient "${name}" is missing from the saved recipe`
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
