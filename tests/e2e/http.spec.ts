import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { APIResponse } from '@playwright/test';
import { expect, test } from './access';

/* What the deployed Worker and its static files answer, over HTTP. No browser engine is involved, so these run once.
   Each check first proves it got Folio's own answer (status, type, page), so an Access page can never pass for one. */
const remote = process.env.BASE_URL?.startsWith('https://') ? process.env.BASE_URL : undefined;
const UNLISTED = ['/now', '/secret'];
const TR = { cookie: 'lang=tr' };

/** A comma-separated header (Cache-Control, Vary, X-Robots-Tag) as a set of lower-case directives. */
const directives = (value?: string) => new Set((value ?? '').split(',').map((d) => d.trim().toLowerCase()).filter(Boolean));
const maxAge = (value?: string) => Number([...directives(value)].find((d) => d.startsWith('max-age='))?.slice('max-age='.length));
const sha256 = (data: Buffer) => createHash('sha256').update(data).digest('hex');

/** The body of a Folio page, after checking it is one. */
async function page(response: APIResponse, status = 200) {
  expect(response.status(), response.url()).toBe(status);
  expect(response.headers()['content-type'], response.url()).toMatch(/^text\/html/);
  const text = await response.text();
  expect(text, response.url()).toContain('<main id="main"');
  return text;
}

test.describe('Cloudflare Access on the Preview', { tag: '@once' }, () => {
  test.skip(!remote, 'needs a deployed Preview');
  const paths = ['/', '/projects', '/projects/helios', '/cv', '/search-index.json', '/_build.json', '/cv/en.pdf', '/fonts/archivo.woff2', '/icons/graphite.svg', '/does-not-exist'];

  for (const [name, headers] of [
    ['no credentials', {}],
    ['a made-up service token', { 'cf-access-client-id': 'not-a-real-id.access', 'cf-access-client-secret': 'not-a-real-secret' }],
  ] as const) {
    test(`requests with ${name} are stopped by Access`, { tag: '@smoke' }, async ({ playwright }) => {
      const anonymous = await playwright.request.newContext({ baseURL: remote, extraHTTPHeaders: headers, maxRedirects: 0 });
      for (const path of paths) {
        const response = await anonymous.get(path);
        expect([302, 401, 403], path).toContain(response.status());
        if (response.status() === 302) expect(new URL(response.headers().location).host, path).toMatch(/\.cloudflareaccess\.com$/);
        expect(await response.text(), path).not.toMatch(/izzet|öztozlu|helios|%PDF/i);
      }
      await anonymous.dispose();
    });
  }
});

test.describe('language', { tag: '@once' }, () => {
  test('one address serves both languages: ?lang, then the cookie, then the browser, then English', { tag: '@smoke' }, async ({ request }) => {
    for (const [query, headers, lang] of [
      ['', {}, 'en'],
      ['', { 'accept-language': 'tr-TR,tr;q=0.9' }, 'tr'],
      ['', TR, 'tr'],
      ['', { cookie: 'lang=en', 'accept-language': 'tr' }, 'en'],
      ['?lang=tr', { cookie: 'lang=en' }, 'tr'],
      ['?lang=en', TR, 'en'],
    ] as [string, Record<string, string>, string][]) {
      const response = await request.get(`/about${query}`, { headers });
      const text = await page(response);
      expect(response.headers()['content-language'], `${query} ${JSON.stringify(headers)}`).toBe(lang);
      expect(text).toContain(`<html lang="${lang}"`);
    }
  });

  test('the internal Turkish copies are never reachable by their own address', { tag: '@smoke' }, async ({ request, baseURL }) => {
    // Full addresses: a path starting with // would otherwise be read as a host name.
    for (const path of ['/__tr/about', '/__TR/about', '/%5F%5Ftr/about', '//__tr/about', '/__tr/about/index.html', '/__tr', '/__tr/search-index.json']) {
      const response = await request.get(`${baseURL}${path}`, { headers: TR });
      await page(response, 404);
      expect(directives(response.headers()['x-robots-tag']), path).toContain('noindex');
    }
    const direct = await request.get('/about/index.html', { headers: TR });
    await page(direct);
    expect(direct.headers()['content-language']).toBe('tr');
  });

  test('caches keep the languages apart: private, short-lived, varying on cookie and language', { tag: '@smoke' }, async ({ request }) => {
    for (const [path, headers] of [['/about', {}], ['/about', TR], ['/search-index.json', TR]] as [string, Record<string, string>][]) {
      const response = await request.get(path, { headers });
      expect(response.status(), path).toBe(200);
      const cache = response.headers()['cache-control'];
      expect(directives(cache), path).toContain('private');
      expect(maxAge(cache), path).toBeLessThanOrEqual(60);
      const vary = directives(response.headers().vary);
      for (const header of ['cookie', 'accept-language']) expect(vary, `${path} varies on ${header}`).toContain(header);
    }
  });

  test('both languages share one clean canonical address, without hreflang', async ({ request }) => {
    const text = await page(await request.get('/about?lang=tr'));
    expect(text).toContain('<link rel="canonical" href="https://oztozlu.dev/about">');
    expect(text).toContain('<meta property="og:locale" content="tr_TR">');
    expect(text).not.toMatch(/<link[^>]+hreflang/);
  });
});

test.describe('indexing', { tag: '@once' }, () => {
  test('unlisted pages work by address but say noindex in both languages and stay out of the sitemap, search and menus', { tag: '@smoke' }, async ({ request }) => {
    for (const path of UNLISTED) for (const headers of [{}, TR]) {
      const response = await request.get(path, { headers });
      const text = await page(response);
      expect(directives(response.headers()['x-robots-tag']), path).toContain('noindex');
      expect(text, path).toContain('<meta name="robots" content="noindex">');
    }
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();
    expect(xml).toContain('<loc>https://oztozlu.dev/about</loc>');
    for (const path of UNLISTED) expect(xml).not.toContain(`dev${path}<`);
    expect(xml).not.toContain('__tr');
    expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: https://oztozlu.dev/sitemap.xml');
    for (const headers of [{}, TR]) {
      const index = await request.get('/search-index.json', { headers });
      expect(index.status()).toBe(200);
      const hrefs = ((await index.json()).pages as { href: string }[]).map((p) => p.href);
      expect(hrefs).toContain('/about');
      for (const path of UNLISTED) expect(hrefs).not.toContain(path);
    }
    for (const path of ['/', '/about', ...UNLISTED]) {
      const response = await request.get(path);
      const text = await page(response);
      // Pages may link to them (About does); the top bar and the footer never do.
      const menus = [/<header class="topbar">[\s\S]*?<\/header>/, /<footer[\s\S]*?<\/footer>/].map((re) => re.exec(text)?.[0] ?? '');
      expect(menus.every(Boolean), `${path} has its top bar and footer`).toBe(true);
      for (const menu of menus) expect(menu, path).not.toMatch(/href="\/(now|secret)"/);
      if (UNLISTED.includes(path)) continue;
      expect(text, path).not.toContain('name="robots"');
      // Cloudflare marks every response from a Preview address noindex; the site itself only marks its own.
      if (!remote) expect(response.headers()['x-robots-tag'], path).toBeUndefined();
    }
  });

  test('unknown pages, removed pages and private repositories answer 404 in the visitor language and stay out of indexes', { tag: '@smoke' }, async ({ request }) => {
    // /uses was removed for good: a real 404, no redirect. Folio's own repository is private, so it is never a project.
    for (const path of ['/does-not-exist', '/projects/does-not-exist', '/projects/folio', '/uses', '/uses/', '/admin', '/About']) {
      const response = await request.get(path);
      await page(response, 404);
      expect(directives(response.headers()['x-robots-tag']), path).toContain('noindex');
    }
    const turkish = await request.get('/does-not-exist', { headers: TR });
    expect(await page(turkish, 404)).toContain('<html lang="tr"');
    expect(await page(await request.get('/projects'))).not.toContain('href="/projects/folio"');
    expect(await (await request.get('/search-index.json')).text()).not.toContain('/projects/folio"');
    expect(await (await request.get('/sitemap.xml')).text()).not.toContain('/uses');
  });
});

test.describe('security and caching', { tag: '@once' }, () => {
  test('pages carry the security headers, and their own policy locks scripts to hashes', { tag: '@smoke' }, async ({ request }) => {
    const response = await request.get('/cv');
    const text = await page(response);
    const headers = response.headers();
    // Framing can only be refused by header: the language Worker sends it, the page's policy tag does the rest.
    expect(headers['content-security-policy']).toMatch(/(^|;)\s*frame-ancestors 'none'/);
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toMatch(/camera=\(\)/);
    const policy = /<meta http-equiv="content-security-policy" content="([^"]+)"/.exec(text)?.[1] ?? '';
    const scripts = policy.split(';').map((d) => d.trim()).find((d) => d.startsWith('script-src')) ?? '';
    expect(scripts).toMatch(/'sha256-/);
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(policy).toMatch(/object-src 'none'/);
  });

  test('hashed assets are immutable, the build note is never cached, the CVs are the committed files and always revalidated', { tag: '@smoke' }, async ({ request }) => {
    const text = await page(await request.get('/cv'));
    for (const asset of [/src="(\/_astro\/[^"]+\.js)"/.exec(text)?.[1], /href="(\/fonts\/[^"]+\.woff2)"/.exec(text)?.[1]]) {
      expect(asset, 'an asset linked from the page').toBeTruthy();
      const response = await request.get(asset!);
      expect(response.status(), asset).toBe(200);
      expect(directives(response.headers()['cache-control']), asset).toContain('immutable');
      expect(maxAge(response.headers()['cache-control']), asset).toBeGreaterThanOrEqual(31536000);
    }

    const build = await request.get('/_build.json');
    expect(build.status()).toBe(200);
    expect(directives(build.headers()['cache-control'])).toContain('no-store');
    const note = await build.json();
    expect(note.sha).toMatch(/^[0-9a-f]{40}$/);
    expect(note.counts).toEqual({ projects: expect.any(Number), written: expect.any(Number), play: expect.any(Number), lab: expect.any(Number) });
    expect(JSON.stringify(note), 'no route list in public').not.toMatch(/unlisted|\/now|\/secret/);

    for (const lang of ['en', 'tr']) {
      const response = await request.get(`/cv/${lang}.pdf`);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toBe('application/pdf');
      expect(directives(response.headers()['cache-control']), 'a replaced PDF is never served stale').toContain('no-cache');
      expect(response.headers().etag).toBeTruthy();
      expect(sha256(await response.body()), `${lang}.pdf is the committed file`).toBe(sha256(readFileSync(`public/cv/${lang}.pdf`)));
    }
  });
});
