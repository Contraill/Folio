import { defineConfig, devices } from '@playwright/test';

/* Runs against the built site in the Workers runtime: `pnpm build && pnpm preview`, then `pnpm test:e2e`. */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // A deployed Preview is reached over the internet and through Access: one retry absorbs network hiccups,
  // and the report still lists such tests as flaky.
  retries: process.env.BASE_URL?.startsWith('https://') ? 1 : 0,
  reporter: 'list',
  use: { baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:4321' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
