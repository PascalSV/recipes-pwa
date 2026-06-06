import { test, expect } from '@playwright/test';
import { login } from './helpers.ts';

test.describe('Login', () => {
  test('shows login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('.login-title')).toContainText('Rezepte');
  });

  test('user buttons are visible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('[data-user="Pascal"]')).toBeVisible();
    await expect(page.locator('[data-user="Claudia"]')).toBeVisible();
  });

  test('sign-in button disabled until user + token entered', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#sign-in-btn')).toBeDisabled();
    await page.click('[data-user="Pascal"]');
    await expect(page.locator('#sign-in-btn')).toBeDisabled(); // still disabled — no token
    await page.fill('#token-input', 'changeme');
    await expect(page.locator('#sign-in-btn')).toBeEnabled();
  });

  test('password toggle shows/hides token input', async ({ page }) => {
    await page.goto('/login');
    const input = page.locator('#token-input');
    await expect(input).toHaveAttribute('type', 'password');
    await page.click('#toggle-pw');
    await expect(input).toHaveAttribute('type', 'text');
    await page.click('#toggle-pw');
    await expect(input).toHaveAttribute('type', 'password');
  });

  test('successful login redirects to recipe list', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL('/');
    await expect(page.locator('.nav-title')).toContainText('Rezepte');
  });

  test('wrong token shows error message', async ({ page }) => {
    await page.goto('/login');
    await page.click('[data-user="Pascal"]');
    await page.fill('#token-input', 'wrong-token');
    await page.click('#sign-in-btn');
    await expect(page.locator('#login-error')).toBeVisible();
  });
});
