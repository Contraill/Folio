/* Before the build: reads the owner's public repositories (with their languages and the last commit on the default
   branch) and profile pins from GitHub into .folio/github.json.
   It uses only GITHUB_TOKEN, which in GitHub Actions is the job's own short-lived token. Private repositories and
   pins are dropped before anything is written, Folio's own repository too, and the log carries counts only.
   Without a token: in CI the build stops; on a developer machine the recorded snapshot in tests/fixtures is used,
   with the recorded catalog of games and lab apps (tests/fixtures/catalog.json). FOLIO_GITHUB=fixture forces both.
   Games and lab apps come from the Folio controller's public catalog (FOLIO_CATALOG_URL), which lists an app once it
   is deployed; an unreachable catalog fails the build like an unreachable GitHub. A failed request fails the build, so production keeps its
   last good version. */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import type { Snapshot } from '../src/content/discover.ts';
import { matches } from './app-builds.ts';
import { type Node, type Pin, publicData } from './github-data.ts';

const OWNER = process.env.FOLIO_OWNER ?? 'Contraill';
const SELF = (process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'Folio').toLowerCase();
const OUT = '.folio/github.json';
const FIXTURE = 'tests/fixtures/github.json';
const CATALOG = 'tests/fixtures/catalog.json';
const CATALOG_URL = process.env.FOLIO_CATALOG_URL ?? 'https://folio-controller.i-canoztozlu.workers.dev/catalog.json';
/* Each game's and lab app's files, by the hash the catalog gives: kept in .folio/builds for postbuild to unpack. */
const BUILDS = '.folio/builds';
rmSync(BUILDS, { recursive: true, force: true });
mkdirSync(BUILDS, { recursive: true });
type Listed = { kind?: string; id?: string; build?: { sha256?: string; size?: number } };
const hashOf = (app: Listed) => (typeof app?.build?.sha256 === 'string' && /^[0-9a-f]{64}$/.test(app.build.sha256) ? app.build.sha256 : null);

const token = process.env.GITHUB_TOKEN;
if (process.env.FOLIO_GITHUB === 'fixture' || !token) {
  if (!token && process.env.CI && process.env.FOLIO_GITHUB !== 'fixture') {
    console.error('GITHUB_TOKEN is missing: refusing to build without GitHub data.');
    process.exit(1);
  }
  const recorded: Snapshot = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  recorded.apps = JSON.parse(readFileSync(CATALOG, 'utf8')).apps;
  for (const app of recorded.apps as Listed[]) { const hash = hashOf(app); if (hash && existsSync(`tests/fixtures/builds/${hash}.json`)) copyFileSync(`tests/fixtures/builds/${hash}.json`, `${BUILDS}/${hash}.json`); }
  writeFileSync(OUT, JSON.stringify(recorded, null, 2) + '\n');
  console.warn(`GitHub: using the recorded snapshot (${FIXTURE}), not live data.`);
  process.exit(0);
}

const QUERY = `query($owner: String!, $after: String) {
  user(login: $owner) {
    pinnedItems(first: 6, types: REPOSITORY) { nodes { ... on Repository { name isPrivate } } }
    repositories(first: 100, after: $after, ownerAffiliations: OWNER, orderBy: { field: PUSHED_AT, direction: DESC }) {
      pageInfo { hasNextPage endCursor }
      nodes {
        databaseId name isPrivate isTemplate isFork isArchived description homepageUrl pushedAt createdAt stargazerCount
        primaryLanguage { name } languages(first: 6, orderBy: { field: SIZE, direction: DESC }) { nodes { name } }
        openGraphImageUrl usesCustomOpenGraphImage
        repositoryTopics(first: 20) { nodes { topic { name } } }
        defaultBranchRef { target { ... on Commit { messageHeadline committedDate url } } }
      }
    }
  }
}`;

async function page(after: string | null) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'folio-build' },
    body: JSON.stringify({ query: QUERY, variables: { owner: OWNER, after } }),
  });
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
  const json = (await res.json()) as { data?: { user: { pinnedItems: { nodes: Pin[] }; repositories: { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: Node[] } } }; errors?: { message: string }[] };
  if (json.errors?.length || !json.data?.user) throw new Error(`GitHub returned errors: ${json.errors?.map((e) => e.message).join('; ') ?? 'no user'}`);
  return json.data.user;
}

const nodes: Node[] = [];
let pinned: Pin[] = [];
let after: string | null = null;
do {
  const user = await page(after);
  if (after === null) pinned = user.pinnedItems.nodes;
  nodes.push(...user.repositories.nodes);
  after = user.repositories.pageInfo.hasNextPage ? user.repositories.pageInfo.endCursor : null;
} while (after);
// Private repositories and pins are dropped here, before anything is written or logged.
const { repos, pins } = publicData(nodes, pinned, SELF);

const catalog = await fetch(CATALOG_URL, { headers: { 'user-agent': 'folio-build' } });
if (!catalog.ok) throw new Error(`The app catalog answered ${catalog.status}`);
const listed = ((await catalog.json()) as { apps: unknown[] }).apps;
if (!Array.isArray(listed)) throw new Error('The app catalog has no list of apps');
// An app whose files can't be fetched, or aren't exactly the checked build, is left out of this build, not trusted.
const apps: unknown[] = [];
for (const app of listed as Listed[]) {
  const hash = hashOf(app);
  const res = hash ? await fetch(new URL(`/builds/${hash}.json`, CATALOG_URL), { headers: { 'user-agent': 'folio-build' } }).catch(() => null) : null;
  const body = res?.ok ? new Uint8Array(await res.arrayBuffer()) : null;
  if (!hash || !body || !matches(body, { sha256: hash, size: app.build?.size ?? -1 })) { console.warn(`catalog: ${app?.kind}/${app?.id} left out: its build ${res ? `answered ${res.status} or ` : ''}does not match its hash`); continue; }
  writeFileSync(`${BUILDS}/${hash}.json`, body);
  apps.push(app);
}
const snapshot: Snapshot = { fetchedAt: new Date().toISOString(), source: 'live', owner: OWNER, repos, pins, apps };
writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n');
console.log(`GitHub: ${repos.length} public repositories, ${snapshot.pins.length} pins; catalog: ${apps.length} apps.`);
