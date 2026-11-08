/* After the build: the route list the language Worker bundles (.folio/routes.json, never public) and /_build.json,
   which says which commit is live and when its GitHub data was read. Neither holds a route list in public. */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Routes } from '../src/lib/language-worker.ts';
import { dataHash } from './data-hash.ts';
import type { Snapshot } from '../src/content/discover.ts';

const DIST = 'dist';
const TR = join(DIST, '__tr');
const pages = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const path = join(dir, e.name);
  if (e.isDirectory()) return path === TR || e.name === '_astro' ? [] : pages(path);
  return e.name === 'index.html' || (dir === DIST && e.name === 'search-index.json') ? [path] : [];
});

const routes: Routes = {};
for (const file of pages(DIST)) {
  const rel = relative(DIST, file);
  const key = '/' + rel.replace(/(^|\/)index\.html$/, '');
  if (key === '/not-found') continue; // served only for addresses that don't exist, with status 404
  routes[key === '/' ? '/' : key.replace(/\/$/, '')] = {
    tr: existsSync(join(TR, rel)),
    unlisted: file.endsWith('.html') && /<meta name="robots" content="noindex"/.test(readFileSync(file, 'utf8')),
  };
}
writeFileSync('.folio/routes.json', JSON.stringify(routes, null, 2) + '\n');

const github: Snapshot = JSON.parse(readFileSync('.folio/github.json', 'utf8'));
// The commit actually built: a scheduled job builds main as it is when it starts, not the commit that queued it.
const sha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
const build = {
  sha,
  builtAt: new Date().toISOString(),
  trigger: process.env.FOLIO_TRIGGER ?? 'local',
  github: { source: github.source, fetchedAt: github.fetchedAt },
  data: dataHash(github),
  counts: JSON.parse(readFileSync('.folio/discovery.json', 'utf8')),
};
writeFileSync(join(DIST, '_build.json'), JSON.stringify(build, null, 2) + '\n');
console.log(`postbuild: ${Object.keys(routes).length} routes (${Object.values(routes).filter((r) => r.unlisted).length} unlisted), build ${sha.slice(0, 7)}`);
