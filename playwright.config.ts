import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'line',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:8788',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 14'] },
    },
  ],
  // Always start a dedicated local test server on port 8788 with an isolated
  // R2 state directory so tests never touch the dev or production R2 bucket.
  webServer: {
    command: 'CLOUDFLARE_API_TOKEN="" CLOUDFLARE_ACCOUNT_ID="" npx wrangler dev --local --port 8788 --persist-to .wrangler/test-state',
    url: 'http://localhost:8788',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
