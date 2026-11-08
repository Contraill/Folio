import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NOT_FOUND, respond, routeKey, type Routes } from './language-worker.ts';

const routes: Routes = { '/': { tr: true, unlisted: false }, '/about': { tr: true, unlisted: false }, '/now': { tr: true, unlisted: true }, '/only-en': { tr: false, unlisted: false }, '/search-index.json': { tr: true, unlisted: false } };
const files: Record<string, [string, string]> = {
  '/': ['home en', 'text/html'], '/__tr': ['home tr', 'text/html'], '/about': ['about en', 'text/html'], '/__tr/about': ['about tr', 'text/html'],
  '/now': ['now en', 'text/html'], '/__tr/now': ['now tr', 'text/html'], '/only-en': ['only en', 'text/html'],
  '/play/gates/app': ['<html><head><title>Gates</title></head><body>game</body></html>', 'text/html'], '/play/gates/app/assets/index-AbCdEf12.js': ['js', 'text/javascript'],
  '/play/gates/app/sounds.json': ['{}', 'application/json'],
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
  for (const headers of [{}, { cookie: 'lang=tr' }] as Record<string, string>[]) assert.equal((await get('/now', headers)).headers.get('x-robots-tag'), 'noindex');
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

test('a game or lab app is served from its own folder, framed by Folio only, with its own policy', async () => {
  const slash = await get('/play/gates/app?folio=1');
  assert.equal(slash.status, 308);
  assert.equal(slash.headers.get('location'), '/play/gates/app/?folio=1', 'relative files need the trailing slash');
  const page = await get('/play/gates/app/', { cookie: 'lang=tr' });
  assert.equal(page.status, 200);
  assert.match(await page.text(), /<head><title>Gates/, 'the app as built, never a language copy');
  assert.match(page.headers.get('content-security-policy')!, /frame-ancestors 'self'/);
  assert.match(page.headers.get('content-security-policy')!, /script-src 'self' 'wasm-unsafe-eval'/);
  assert.equal(page.headers.get('cache-control'), 'no-cache');
  assert.equal(page.headers.get('content-language'), null);
  assert.equal((await get('/play/gates/app/index.html')).status, 200);
  const js = await get('/play/gates/app/assets/index-AbCdEf12.js');
  assert.equal(js.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  assert.equal((await get('/play/gates/app/sounds.json')).headers.get('cache-control'), 'no-cache');
});

test('an app address it does not have is its page, with a base for its files; a missing file or app is 404', async () => {
  const route = await get('/play/gates/app/level/3');
  assert.equal(route.status, 200);
  assert.match(await route.text(), /<head><base href="\/play\/gates\/app\/"><title>/);
  assert.equal((await get('/play/gates/app/missing.js')).status, 404);
  assert.equal((await get('/play/nothing/app/')).status, 404);
  assert.equal((await get('/lab/gates/app/')).status, 404, 'a game is not a lab app');
  assert.equal((await get('/play/Gates/app/')).status, 404, 'addresses are lower case');
  assert.equal((await get('/play/gates/app/', {}, 'POST')).status, 405);
});
