import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NOT_FOUND, respond, routeKey, type Routes } from './language-worker.ts';

const routes: Routes = { '/': { tr: true, unlisted: false }, '/about': { tr: true, unlisted: false }, '/uses': { tr: true, unlisted: true }, '/only-en': { tr: false, unlisted: false }, '/search-index.json': { tr: true, unlisted: false } };
const files: Record<string, [string, string]> = {
  '/': ['home en', 'text/html'], '/__tr': ['home tr', 'text/html'], '/about': ['about en', 'text/html'], '/__tr/about': ['about tr', 'text/html'],
  '/uses': ['uses en', 'text/html'], '/__tr/uses': ['uses tr', 'text/html'], '/only-en': ['only en', 'text/html'],
  [NOT_FOUND]: ['missing en', 'text/html'], [`/__tr${NOT_FOUND}`]: ['missing tr', 'text/html'], '/search-index.json': ['{"en":1}', 'application/json'], '/__tr/search-index.json': ['{"tr":1}', 'application/json'],
};
const asked: string[] = [];
const assets = { fetch: async (r: Request) => { const path = new URL(r.url).pathname; asked.push(path); const f = files[path]; return f ? new Response(f[0], { headers: { 'content-type': f[1] } }) : new Response('nope', { status: 404 }); } };
const get = (path: string, headers: Record<string, string> = {}, method = 'GET') => respond(new Request(`https://oztozlu.dev${path}`, { headers, method }), assets, routes);

test('every spelling of the internal prefix is refused', () => {
  for (const p of ['/__tr', '/__tr/', '/__tr/about', '/__tr/about/', '/__tr/about/index.html', '/__TR/about', '/__Tr/about', '/%5F%5Ftr/about', '/%5f%5fTR/about', '//__tr/about', '///__tr//about', '/%2F__tr/about'])
    assert.equal(routeKey(p), null, p);
  assert.equal(routeKey('/%E0%A4%A'), null, 'malformed encoding');
});

test('addresses are normalised before lookup', () => {
  for (const [p, key] of [['/', '/'], ['/about', '/about'], ['/about/', '/about'], ['/about/index.html', '/about'], ['/index.html', '/'], ['//about', '/about'], ['/__trx', '/__trx']]) assert.equal(routeKey(p), key, p);
});

test('the language comes from ?lang, then the cookie, then Accept-Language, then English', async () => {
  assert.equal(await (await get('/about')).text(), 'about en');
  assert.equal(await (await get('/about', { 'accept-language': 'tr-TR,tr;q=0.9,en;q=0.8' })).text(), 'about tr');
  assert.equal(await (await get('/about', { cookie: 'lang=tr' })).text(), 'about tr');
  assert.equal(await (await get('/about', { cookie: 'lang=en', 'accept-language': 'tr' })).text(), 'about en');
  assert.equal(await (await get('/about?lang=tr', { cookie: 'lang=en' })).text(), 'about tr');
  assert.equal(await (await get('/', { cookie: 'lang=tr' })).text(), 'home tr');
  assert.equal(await (await get('/search-index.json', { cookie: 'lang=tr' })).text(), '{"tr":1}');
});

test('responses carry the language, privacy and security headers', async () => {
  const r = await get('/about', { cookie: 'lang=tr' });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-language'), 'tr');
  assert.equal(r.headers.get('vary'), 'Cookie, Accept-Language');
  assert.equal(r.headers.get('cache-control'), 'private, max-age=60');
  assert.equal(r.headers.get('content-security-policy'), "frame-ancestors 'none'");
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('x-robots-tag'), null);
  assert.equal((await get('/search-index.json')).headers.get('content-type'), 'application/json');
});

test('unlisted pages say noindex in both languages', async () => {
  for (const headers of [{}, { cookie: 'lang=tr' }] as Record<string, string>[]) assert.equal((await get('/uses', headers)).headers.get('x-robots-tag'), 'noindex');
});

test('a page without its Turkish file is served in English', async () => {
  const r = await get('/only-en', { cookie: 'lang=tr' });
  assert.equal(await r.text(), 'only en');
  assert.equal(r.headers.get('content-language'), 'en');
});

test('unknown addresses and the internal prefix get the not-found page, in the visitor language', async () => {
  for (const p of ['/nope', '/__tr/about', '/%5F%5Ftr/about', '/About']) {
    const r = await get(p, { cookie: 'lang=tr' });
    assert.equal(r.status, 404, p);
    assert.equal(await r.text(), 'missing tr', p);
    assert.equal(r.headers.get('x-robots-tag'), 'noindex', p);
  }
  // Asking for an internal file directly never fetches it: only the not-found page is read.
  asked.length = 0;
  await get('/__tr/about', { cookie: 'lang=tr' });
  assert.deepEqual(asked, [`/__tr${NOT_FOUND}`]);
});

test('only GET and HEAD are answered', async () => {
  assert.equal((await get('/about', {}, 'POST')).status, 405);
  const head = await get('/about', {}, 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});
