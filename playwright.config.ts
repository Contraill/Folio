import { defineConfig, devices } from '@playwright/test';

/* Runs against the built site in the Workers runtime: `pnpm build && pnpm preview`, then `pnpm test:e2e`. */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:4321' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
