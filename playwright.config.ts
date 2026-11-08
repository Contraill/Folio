import { defineConfig, devices } from '@playwright/test';

/* Runs against the built site behind the language Worker: `pnpm build`, then `pnpm test:e2e`, which starts
   `wrangler dev` unless one is already running or BASE_URL points elsewhere. Against a deployed Preview, a preflight
   first proves that the Access token reaches Folio; if it doesn't, nothing runs.
   Tags: `@smoke` is the quick run after every push (`pnpm test:smoke`); `@once` marks tests whose subject doesn't
   depend on the browser engine (HTTP, app logic), run in Chromium only. Everything else runs in Chromium and Firefox.
   The `visual` project compares screens with ones recorded earlier on the same machine (`pnpm test:visual`). */
const remote = process.env.BASE_URL?.startsWith('https://');
const token = !!process.env.CF_ACCESS_CLIENT_SECRET;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // A deployed Preview is reached over the internet and through Access, every request passing the token step:
  // three workers keep its timing-sensitive tests steady, one retry absorbs network hiccups, and the report
  // still lists such tests as flaky.
  workers: remote ? 3 : undefined,
  retries: remote ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  globalSetup: './tests/e2e/preflight.ts',
  webServer: process.env.BASE_URL ? undefined : { command: 'pnpm exec wrangler dev --port 4321', url: 'http://localhost:4321', reuseExistingServer: true, timeout: 60_000 },
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:4321',
    screenshot: 'only-on-failure',
    // Traces record request headers, the Access token among them: none while a token is in use.
    trace: token ? 'off' : 'retain-on-failure',
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /visual\.spec\.ts/ },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: /visual\.spec\.ts/, grepInvert: /@once/ },
    { name: 'visual', use: { ...devices['Desktop Chrome'] }, testMatch: /visual\.spec\.ts/ },
    // Safari's engine, for the critical path only, in CI's full run (WebKit can't run on every machine): FOLIO_WEBKIT=1.
    ...(process.env.FOLIO_WEBKIT ? [{ name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: /visual\.spec\.ts/, grep: /@smoke/, grepInvert: /@once/ }] : []),
  ],
});
