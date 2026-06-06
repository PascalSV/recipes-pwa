import { Page } from '@playwright/test';

export const TEST_TOKEN = process.env.TEST_TOKEN ?? 'changeme';
export const TEST_USER  = process.env.TEST_USER  ?? 'Pascal';

/** Log the test user in and store the token in localStorage. */
export async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.click(`[data-user="${TEST_USER}"]`);
  await page.fill('#token-input', TEST_TOKEN);
  await page.click('#sign-in-btn');
  await page.waitForURL('/');
}

/** Create a recipe via the API and return its id. */
export async function createRecipeViaApi(page: Page, recipe: object): Promise<string> {
  const id = crypto.randomUUID();
  const token = await page.evaluate(() => localStorage.getItem('token'));
  await page.request.put(`/api/recipes/${id}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { ...recipe, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  });
  return id;
}
