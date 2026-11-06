import { defineConfig, devices } from '@playwright/test';

/* Runs against the built site behind the language Worker: `pnpm build`, then `pnpm test:e2e`, which starts
   `wrangler dev` unless one is already running or BASE_URL points elsewhere. */
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
  webServer: process.env.BASE_URL ? undefined : { command: 'pnpm exec wrangler dev --port 4321', url: 'http://localhost:4321', reuseExistingServer: true, timeout: 60_000 },
  use: { baseURL: process.env.BASE_URL ?? 'http://localhost:4321' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
