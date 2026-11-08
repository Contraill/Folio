import { test as base, expect, type APIRequestContext, type BrowserContext } from '@playwright/test';

/* Previews sit behind Cloudflare Access. With a service token in the environment, its headers are added to
   requests for the Preview host only, never to another host, and the token itself never appears in the code. */
const id = process.env.CF_ACCESS_CLIENT_ID;
const secret = process.env.CF_ACCESS_CLIENT_SECRET;
const host = process.env.BASE_URL ? new URL(process.env.BASE_URL).host : null;
const headers = id && secret && host ? { 'cf-access-client-id': id, 'cf-access-client-secret': secret } : null;

/** Playwright prints every request header when an API request fails: the token must not reach the output. */
function redacted(error: unknown) {
  if (error instanceof Error && id && secret) for (const value of [id, secret]) {
    error.message = error.message.replaceAll(value, '[redacted]');
    error.stack = error.stack?.replaceAll(value, '[redacted]');
  }
  return error;
}
const guarded = (context: APIRequestContext) => new Proxy(context, {
  get(target, key) {
    const value = Reflect.get(target, key, target);
    if (typeof value !== 'function') return value;
    return (...args: unknown[]) => {
      try {
        const result = value.apply(target, args);
        return result instanceof Promise ? result.catch((e: unknown) => { throw redacted(e); }) : result;
      } catch (e) { throw redacted(e); }
    };
  },
});

/** Pages Cloudflare Access answered instead of the site, during the current test. */
const accessPages: string[] = [];

async function authorize(context: BrowserContext) {
  if (headers) await context.route((url) => url.host === host, (route) => route.fallback({ headers: { ...route.request().headers(), ...headers } }));
  // Access marks its own login and refusal pages; Folio's responses never carry this header.
  context.on('response', (response) => { if (response.headers()['cf-access-aud']) accessPages.push(`${response.status()} ${response.url()}`); });
  return context;
}

export const test = base.extend<{ accessGuard: void }>({
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
    await use(guarded(authorized));
    await authorized.dispose();
  },
  // A test that only saw Access's own pages must fail, whatever it asserted.
  accessGuard: [async ({}, use) => {
    accessPages.length = 0;
    await use();
    expect(accessPages, 'Cloudflare Access answered instead of Folio').toEqual([]);
  }, { auto: true }],
});

export { expect };
