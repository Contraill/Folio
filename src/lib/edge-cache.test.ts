import assert from 'node:assert/strict';
import { test } from 'node:test';
import { anonymous, forBrowser, LANG, sharedCacheControl, sharedCacheGeneration, stripInternal, VIA_CACHE } from './edge-cache.ts';

const store = (state: Record<string, string> | Error) => ({
  prepare: () => ({ all: async <T>() => { if (state instanceof Error) throw state; return { results: Object.entries(state).map(([key, value]) => ({ key, value })) as T[] }; } }),
});
const on = store({ page_cache: 'on', cache_generation: '7' });

test('the shared cache is used only when the environment allows it and the switch is on', async () => {
  const get = new Request('https://example.test/');
  assert.equal(await sharedCacheGeneration(get, { PAGE_CACHE: 'allowed', DB: on }), 7);
  assert.equal(await sharedCacheGeneration(get, { PAGE_CACHE: 'off', DB: on }), null);
  assert.equal(await sharedCacheGeneration(get, { DB: on }), null);
  assert.equal(await sharedCacheGeneration(get, { PAGE_CACHE: 'allowed' }), null);
  assert.equal(await sharedCacheGeneration(get, { PAGE_CACHE: 'allowed', DB: store({ page_cache: 'off', cache_generation: '7' }) }), null);
});

test('writes, credentials and an unreadable switch never use the shared cache', async () => {
  const env = { PAGE_CACHE: 'allowed', DB: on };
  assert.equal(await sharedCacheGeneration(new Request('https://example.test/', { method: 'POST' }), env), null);
  assert.equal(await sharedCacheGeneration(new Request('https://example.test/', { headers: { authorization: 'Bearer x' } }), env), null);
  assert.equal(await sharedCacheGeneration(new Request('https://example.test/'), { PAGE_CACHE: 'allowed', DB: store(new Error('D1 down')) }), null);
  assert.equal(await sharedCacheGeneration(new Request('https://example.test/'), { PAGE_CACHE: 'allowed', DB: store({ page_cache: 'on', cache_generation: 'x' }) }), null);
});

test('the cached renderer gets nothing personal, and outside requests cannot pose as the gateway', () => {
  const request = new Request('https://example.test/about?lang=tr', { headers: { cookie: 'lang=tr; CF_Authorization=secret', 'accept-language': 'tr', authorization: 'Bearer x', 'user-agent': 'ua' } });
  const forwarded = anonymous(request, 'tr');
  assert.equal(forwarded.url, request.url);
  assert.equal(forwarded.headers.get(LANG), 'tr');
  assert.equal(forwarded.headers.get(VIA_CACHE), '1');
  for (const h of ['cookie', 'accept-language', 'authorization']) assert.equal(forwarded.headers.get(h), null, h);

  const spoofed = stripInternal(new Request('https://example.test/', { headers: { [LANG]: 'tr', [VIA_CACHE]: '1', cookie: 'lang=en' } }));
  assert.equal(spoofed.headers.get(LANG), null);
  assert.equal(spoofed.headers.get(VIA_CACHE), null);
  assert.equal(spoofed.headers.get('cookie'), 'lang=en');
});

test('only a public, published page that rendered fine may be shared; browsers always get the private header', () => {
  assert.match(sharedCacheControl(true, 200), /^public, s-maxage=\d+$/);
  assert.equal(sharedCacheControl(false, 200), 'private, max-age=60');
  assert.equal(sharedCacheControl(true, 404), 'private, max-age=60');
  assert.equal(sharedCacheControl(true, 500), 'private, max-age=60');
  const out = forBrowser(new Response('x', { headers: { 'cache-control': 'public, s-maxage=300' } }));
  assert.equal(out.headers.get('cache-control'), 'private, max-age=60');
  assert.equal(out.headers.get('vary'), 'Cookie, Accept-Language');
  assert.equal(forBrowser(new Response('x', { headers: { 'cache-control': 'no-store' } })).headers.get('cache-control'), 'no-store');
});
