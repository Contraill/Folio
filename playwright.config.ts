import { defineConfig, devices } from '@playwright/test';

/* Runs against the built site as Cloudflare serves it: `pnpm build`, then `pnpm test:e2e`, which starts `wrangler dev`
   unless one is already running or BASE_URL points elsewhere. Against a deployed Preview, a preflight first proves that
   the Access token reaches the site; if it doesn't, nothing runs.
   Tags: `@smoke` is the quick run after every push (`pnpm test:smoke`); `@once` marks tests that don't depend on the
   browser engine (HTTP, files), run in Chromium only. Everything else runs in Chromium and Firefox. */
const remote = process.env.BASE_URL?.startsWith('https://');
const token = !!process.env.CF_ACCESS_CLIENT_SECRET;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Over the internet and through Access: fewer workers keep timing steady, one retry absorbs network hiccups.
  workers: remote ? 3 : undefined,
  retries: remote ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  globalSetup: './tests/e2e/preflight.ts',
  webServer: process.env.BASE_URL ? undefined : { command: 'pnpm exec wrangler dev --port 4321 --ip 127.0.0.1', url: 'http://127.0.0.1:4321', reuseExistingServer: true, timeout: 60_000 },
  use: {
    baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:4321',
    // An English browser: a Turkish one is sent to /tr on its first visit, which has its own test.
    locale: 'en-US',
    screenshot: 'only-on-failure',
    // Traces record request headers, the Access token among them: none while a token is in use.
    trace: token ? 'off' : 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], locale: 'en-US' } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], locale: 'en-US' }, grepInvert: /@once/ },
    // Safari's engine, for the smoke tests only, in the Preview's full run (WebKit can't run on every machine).
    ...(process.env.FOLIO_WEBKIT ? [{ name: 'webkit', use: { ...devices['Desktop Safari'], locale: 'en-US' }, expect: { timeout: token ? 15_000 : 5_000 }, grep: /@smoke/, grepInvert: /@once/ }] : []),
  ],
});
