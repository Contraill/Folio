import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

/* Checks on the static output: run after `pnpm build`. */
const dist = new URL('../dist/', import.meta.url).pathname;
const skip = !existsSync(join(dist, '_build.json')) && 'run after a build';
const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));
const read = (path: string) => readFileSync(join(dist, path), 'utf8');
const UNLISTED = ['/uses', '/now', '/secret'];

test('no public file carries the route list or links to the internal prefix', { skip }, () => {
  const routes = JSON.parse(readFileSync(new URL('../.folio/routes.json', import.meta.url), 'utf8'));
  for (const file of files(dist).filter((f) => /\.(html|json|xml|js|txt)$/.test(f))) {
    const text = readFileSync(file, 'utf8');
    assert.ok(!/href="\/__tr/.test(text), `${file} links to /__tr`);
    assert.ok(!text.includes('"unlisted":'), `${file} looks like the route list`);
  }
  assert.ok(!existsSync(join(dist, 'routes.json')));
  assert.deepEqual(UNLISTED.filter((p) => routes[p]?.unlisted), UNLISTED);
});

test('/_build.json says which build is live and nothing more', { skip }, () => {
  const build = JSON.parse(read('_build.json'));
  assert.deepEqual(Object.keys(build), ['sha', 'builtAt', 'trigger', 'github', 'counts']);
  assert.match(build.sha, /^[0-9a-f]{40}$/);
  assert.deepEqual(Object.keys(build.counts), ['projects', 'play', 'lab']);
});

test('unlisted pages stay out of the sitemap and the site search, and say noindex in both languages', { skip }, () => {
  const sitemap = read('sitemap.xml');
  for (const p of UNLISTED) {
    assert.ok(!sitemap.includes(`dev${p}<`), `${p} in the sitemap`);
    for (const index of ['search-index.json', '__tr/search-index.json']) assert.ok(!read(index).includes(`"${p}"`), `${p} in ${index}`);
    for (const prefix of ['', '__tr']) assert.match(read(join(prefix, p, 'index.html')), /<meta name="robots" content="noindex">/, `${prefix}${p}`);
  }
  assert.ok(!sitemap.includes('__tr'));
  for (const p of ['index.html', 'about/index.html', 'projects/index.html', '__tr/about/index.html']) assert.doesNotMatch(read(p), /name="robots"/, p);
});

test('the CV PDFs are served exactly as uploaded', { skip }, () => {
  for (const lang of ['en', 'tr']) {
    const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
    assert.equal(hash(join(dist, 'cv', `${lang}.pdf`)), hash(new URL(`../public/cv/${lang}.pdf`, import.meta.url).pathname));
    assert.equal(readFileSync(join(dist, 'cv', `${lang}.pdf`)).subarray(0, 5).toString(), '%PDF-');
  }
});
