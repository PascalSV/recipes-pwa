import { test, expect } from '@playwright/test';
import { login } from './helpers.ts';

// On the new page the Back button doubles as Cancel: it must ask for
// confirmation whenever the form contains anything that was not there when
// the page loaded (paste text, skipped-in paste, or any form field).
test.describe('New recipe — Back dirty check', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/recipe/new');
  });

  test('back on an untouched form goes straight home', async ({ page }) => {
    await page.click('.nav-left button');
    await expect(page).toHaveURL('/');
  });

  test('back after skipping to an empty form goes straight home', async ({ page }) => {
    await page.click('#skip-parse-btn');
    await page.click('.nav-left button');
    await expect(page).toHaveURL('/');
  });

  test('back after pasting text asks for confirmation', async ({ page }) => {
    await page.fill('#paste-input', 'Gulasch\n500 g Rindfleisch');
    await page.click('.nav-left button');
    await expect(page.locator('.dialog-sheet')).toBeVisible();

    // Cancel keeps the typed text on the page
    await page.click('.dialog-sheet .dialog-action-cancel');
    await expect(page).toHaveURL('/recipe/new');
    // toHaveValue (not toContainText): fill() sets the textarea value without
    // a text node, so text-based matchers see "" even though the value is set.
    await expect(page.locator('#paste-input')).toHaveValue('Gulasch\n500 g Rindfleisch');

    // Confirm discards and navigates home
    await page.click('.nav-left button');
    await page.click('.dialog-sheet .dialog-action-danger');
    await expect(page).toHaveURL('/');
  });

  test('back after editing the form asks for confirmation', async ({ page }) => {
    await page.click('#skip-parse-btn');
    await page.fill('#recipe-name', 'Testrezept');
    await page.click('.nav-left button');
    await expect(page.locator('.dialog-sheet')).toBeVisible();
    await page.click('.dialog-sheet .dialog-action-danger');
    await expect(page).toHaveURL('/');
  });
});
