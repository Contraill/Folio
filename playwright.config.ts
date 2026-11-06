import { defineConfig, devices } from '@playwright/test';

/* Runs against the built site in the Workers runtime: `pnpm build && pnpm preview`, then `pnpm test:e2e`. */
const remote = process.env.BASE_URL?.startsWith('https://');

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // A deployed Preview is reached over the internet and through Access, every request passing the token step:
  // three workers keep its timing-sensitive tests steady, one retry absorbs network hiccups, and the report
  // still lists such tests as flaky.
  workers: remote ? 3 : undefined,
  retries: remote ? 1 : 0,
  reporter: 'list',
  use: { baseURL: process.env.BASE_URL ?? 'http://localhost:4321' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
