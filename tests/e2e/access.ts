import { test as base, type BrowserContext } from '@playwright/test';

/* Previews sit behind Cloudflare Access. With a service token in the environment, its headers are added to
   requests for the Preview host only, never to another host, and the token itself never appears in the code. */
const id = process.env.CF_ACCESS_CLIENT_ID;
const secret = process.env.CF_ACCESS_CLIENT_SECRET;
const host = process.env.BASE_URL ? new URL(process.env.BASE_URL).host : null;
const headers = id && secret && host ? { 'cf-access-client-id': id, 'cf-access-client-secret': secret } : null;

async function authorize(context: BrowserContext) {
  if (headers) await context.route((url) => url.host === host, (route) => route.fallback({ headers: { ...route.request().headers(), ...headers } }));
  return context;
}

export const test = base.extend({
  // Covers the default context as well as the ones tests open themselves.
  browser: [async ({ browser }, use) => {
    const open = browser.newContext.bind(browser);
    browser.newContext = async (options) => authorize(await open(options));
    await use(browser);
  }, { scope: 'worker' }],
  // Redirects are not followed, so the headers cannot travel past the Preview.
  request: async ({ request, playwright, baseURL }, use) => {
    if (!headers) return use(request);
    const authorized = await playwright.request.newContext({ baseURL, extraHTTPHeaders: headers, maxRedirects: 0 });
    await use(authorized);
    await authorized.dispose();
  },
});

export { expect } from '@playwright/test';
