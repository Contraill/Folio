/* Exercises the shared page cache on the real Preview, behind Access, and leaves it switched off.
   usage (token in the environment, sent to the Preview host only):
     CF_ACCESS_CLIENT_ID=… CF_ACCESS_CLIENT_SECRET=… node scripts/verify-page-cache.ts https://develop-folio.<subdomain>.workers.dev
   It changes the Preview database while it runs (the switch, a test revision, a project taken off and put back)
   and restores every published pointer before it ends. Revisions it adds stay in the history, as all do. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { publishDraft, publishRevision, saveDraft, type Statement, toSql, unpublish } from '../src/content/store.ts';

const base = process.argv[2];
if (!base?.startsWith('https://')) throw new Error('usage: node scripts/verify-page-cache.ts <Preview URL>');
const auth = { 'cf-access-client-id': process.env.CF_ACCESS_CLIENT_ID ?? '', 'cf-access-client-secret': process.env.CF_ACCESS_CLIENT_SECRET ?? '' };
const root = resolve(import.meta.dirname, '..');
const tmp = mkdtempSync(join(tmpdir(), 'folio-cache-'));
const d1 = (args: string[]) => execFileSync('pnpm', ['exec', 'wrangler', 'd1', 'execute', 'folio-preview', '--remote', '--config', 'wrangler.preview-migrations.jsonc', ...args], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const query = <T>(sql: string): T[] => JSON.parse(d1(['--json', '--command', sql]))[0].results;
const write = (statements: Statement[]) => { const f = join(tmp, `${Date.now()}.sql`); writeFileSync(f, toSql(statements)); d1(['--yes', '--file', f]); };
const setSwitch = (value: 'on' | 'off') => query(`UPDATE meta SET value = '${value}' WHERE key = 'page_cache'`);
const published = (entry: string, locale: string) => query<{ id: string }>(`SELECT published_id AS id FROM entry_locale WHERE entry_id = '${entry}' AND locale = '${locale}'`)[0].id;

type Page = { status: number; lang: string | null; via: string | null; cache: string | null; html: string; cacheControl: string | null; location: string | null };
async function get(path: string, headers: Record<string, string> = {}, withToken = true): Promise<Page> {
  const r = await fetch(base + path, { headers: { ...(withToken ? auth : {}), ...headers }, redirect: 'manual' });
  const html = await r.text();
  return { status: r.status, lang: /<html[^>]* lang="(\w+)"/.exec(html)?.[1] ?? null, via: r.headers.get('x-page-cache'), cache: r.headers.get('cf-cache-status'), html, cacheControl: r.headers.get('cache-control'), location: r.headers.get('location') };
}
const results: [string, boolean, string][] = [];
const expect = (name: string, ok: boolean, detail = '') => { results.push([name, ok, detail]); console.log(`${ok ? '✓' : '✘'} ${name}${detail ? `  (${detail})` : ''}`); };
const twice = async (path: string, headers: Record<string, string> = {}) => { await get(path, headers); return get(path, headers); };

const aboutEn = published('page:about', 'en');
const bctEn = published('project:bct', 'en');
try {
  setSwitch('off');
  const off = await get('/');
  expect('switched off: pages are rendered without the cache', off.status === 200 && off.via === null);

  setSwitch('on');
  const warm = await twice('/');
  expect('switched on: a page is stored and served from the cache', warm.via === 'on' && warm.cache === 'HIT', `cf-cache-status ${warm.cache}`);
  expect('browsers still get the private header', warm.cacheControl === 'private, max-age=60', warm.cacheControl ?? '');

  // Access stands in front of everything, the cache included.
  for (const path of ['/', '/about']) {
    const anonymous = await get(path, {}, false);
    expect(`Access stops an unauthenticated request for cached ${path}`, [302, 401, 403].includes(anonymous.status) && !/izzet/i.test(anonymous.html), `status ${anonymous.status}`);
  }

  // English and Turkish never mix, whichever way the language is chosen and whichever was cached first.
  for (const path of ['/', '/about', '/projects/helios']) {
    for (let round = 0; round < 2; round++) {
      const en = await get(path), tr1 = await get(path, { cookie: 'lang=tr' }), tr2 = await get(path, { 'accept-language': 'tr-TR,tr;q=0.9' }), tr3 = await get(`${path}${path.includes('?') ? '&' : '?'}lang=tr`), en2 = await get(path, { cookie: 'lang=en', 'accept-language': 'tr' });
      const ok = en.lang === 'en' && tr1.lang === 'tr' && tr2.lang === 'tr' && tr3.lang === 'tr' && en2.lang === 'en';
      expect(`${path} round ${round + 1}: language right for default, cookie, Accept-Language, ?lang and an English cookie`, ok, [en, tr1, tr2, tr3, en2].map((p) => `${p.lang}/${p.cache}`).join(' '));
    }
  }

  // Unlisted pages, missing pages and data are never shared.
  for (const path of ['/uses', '/now', '/secret', '/does-not-exist', '/projects/nodesk', '/search-index.json']) {
    const second = await twice(path);
    expect(`${path} is not kept by the shared cache`, second.cache !== 'HIT', `status ${second.status}, cf-cache-status ${second.cache}`);
  }

  // A publish shows at once, in its language only.
  await twice('/about'); await twice('/about?lang=tr');
  const body = JSON.parse(query<{ body: string }>(`SELECT body FROM revision WHERE id = '${aboutEn}'`)[0].body);
  const marker = `About ${Date.now()}`;
  write([...saveDraft({ id: 'page:about', type: 'page', slug: 'about' }, 'en', { ...body, title: marker }, 'cache-check', 'Temporary revision from scripts/verify-page-cache.ts'), ...publishDraft('page:about', 'en')]);
  const afterPublish = await get('/about'), trAfter = await get('/about?lang=tr');
  expect('a publish is visible on the next request', afterPublish.html.includes(marker), `cf-cache-status ${afterPublish.cache}`);
  expect('a publish in English leaves the Turkish page as it was', !trAfter.html.includes(marker) && trAfter.lang === 'tr');
  write(publishRevision('page:about', 'en', aboutEn));
  const restored = await get('/about');
  expect('putting the earlier revision back is visible at once', !restored.html.includes(marker));

  // Taking a project off the site does not wait for any cache lifetime.
  const before = await twice('/projects/bct');
  write(unpublish('project:bct', 'en'));
  const gone = await get('/projects/bct'), list = await get('/projects');
  expect('a project taken off is gone at once, though it was cached', before.cache === 'HIT' && gone.status === 404 && !list.html.includes('/projects/bct'), `before ${before.cache}, after ${gone.status}`);
  write(publishRevision('project:bct', 'en', bctEn));
  expect('and comes back when published again', (await get('/projects/bct')).status === 200);

  // If the switch cannot be read, pages are rendered without the cache rather than failing.
  query('ALTER TABLE meta RENAME TO meta_unreadable');
  try {
    const fallback = await get('/');
    expect('an unreadable switch falls back to rendering without the cache', fallback.status === 200 && fallback.via === null, `status ${fallback.status}`);
  } finally {
    query('ALTER TABLE meta_unreadable RENAME TO meta');
  }

  setSwitch('off');
  const killed = await get('/');
  expect('switching off takes effect on the next request', killed.status === 200 && killed.via === null && killed.cache !== 'HIT');
} finally {
  setSwitch('off');
  write([{ sql: "UPDATE meta SET value = CAST(value AS INTEGER) + 1 WHERE key = 'cache_generation'", args: [] }]);
  rmSync(tmp, { recursive: true, force: true });
}
const failed = results.filter(([, ok]) => !ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed. The cache is switched off.`);
if (failed) process.exit(1);
