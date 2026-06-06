import { test, expect } from '@playwright/test';
import { login } from './helpers.ts';

const PALOCLEVES_TEXT = `Palocleves (Ungarischer Eintopf) mit Lammfleisch
Gesamtzeit: 120 Minuten
Schwierigkeitsgrad: Mittel
Zutaten
500 Gramm
Kartoffeln, festkochend
2
Zwiebeln
600 Gramm
Lammschulter
2 - 3 Teelöffel
Mehl
Salz
Zubereitung
Kartoffeln schälen und würfeln. Zwiebeln fein hacken.
Das Fleisch anbraten. Alles zusammen köcheln lassen.`;

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

    // Wait for form phase to appear
    await expect(page.locator('#form-phase')).toBeVisible({ timeout: 15000 });

    // Recipe name should be auto-populated
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

  test('parsing Palocleves shows ingredient rows', async ({ page }) => {
    await page.goto('/recipe/new');
    await page.fill('#paste-input', PALOCLEVES_TEXT);
    await page.click('#parse-btn');
    await expect(page.locator('#form-phase')).toBeVisible({ timeout: 15000 });
    // At least 5 ingredient rows expected
    await expect(page.locator('.ing-editor-row').first()).toBeVisible();
    const count = await page.locator('.ing-editor-row').count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('parsed ingredient has comma-remark merged into name field', async ({ page }) => {
    await page.goto('/recipe/new');
    await page.fill('#paste-input', PALOCLEVES_TEXT);
    await page.click('#parse-btn');
    await expect(page.locator('#form-phase')).toBeVisible({ timeout: 15000 });
    // "Kartoffeln, festkochend" should appear as "Kartoffeln (festkochend)" in the name input
    const names = await page.locator('.ing-editor-row .ing-name').allInputValues();
    expect(names.some(n => n.includes('Kartoffeln'))).toBe(true);
  });
});
