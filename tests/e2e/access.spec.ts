import { expect, test } from './access';

/* Runs against a deployed Preview only: without valid Access credentials, nothing of the site comes back. */
const remote = process.env.BASE_URL?.startsWith('https://') ? process.env.BASE_URL : undefined;
const paths = ['/', '/projects', '/projects/helios', '/cv', '/search-index.json', '/fonts/archivo.woff2', '/icons/graphite.svg', '/favicon.ico', '/does-not-exist'];

test.describe('Cloudflare Access on the Preview', () => {
  test.skip(!remote, 'needs a deployed Preview');

  for (const [name, headers] of [
    ['no credentials', {}],
    ['a made-up service token', { 'cf-access-client-id': 'not-a-real-id.access', 'cf-access-client-secret': 'not-a-real-secret' }],
  ] as const) {
    test(`requests with ${name} are stopped by Access`, async ({ playwright }) => {
      const anonymous = await playwright.request.newContext({ baseURL: remote, extraHTTPHeaders: headers, maxRedirects: 0 });
      for (const path of paths) {
        const response = await anonymous.get(path);
        expect([302, 401, 403], path).toContain(response.status());
        if (response.status() === 302) expect(new URL(response.headers().location).host, path).toMatch(/\.cloudflareaccess\.com$/);
        expect(await response.text(), path).not.toMatch(/izzet|öztozlu|helios/i);
      }
      await anonymous.dispose();
    });
  }

  test('the service token from the environment reaches the site', async ({ request, page }) => {
    test.skip(!process.env.CF_ACCESS_CLIENT_ID || !process.env.CF_ACCESS_CLIENT_SECRET, 'needs the service token');
    for (const path of ['/', '/search-index.json', '/icons/graphite.svg']) expect((await request.get(path)).status(), path).toBe(200);
    await page.goto('/');
    await expect(page.locator('main#main')).toBeVisible();
    await expect(page).toHaveURL(new URL('/', remote).href);
  });
});
