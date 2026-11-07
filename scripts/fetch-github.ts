/* Before the build: reads the owner's repositories and profile pins from GitHub into .folio/github.json.
   It uses only GITHUB_TOKEN, which in GitHub Actions is the job's own short-lived token. Private repositories and
   pins are dropped before anything is written, Folio's own repository too, and the log carries counts only.
   Without a token: in CI the build stops; on a developer machine the recorded snapshot in tests/fixtures is used,
   with the recorded catalog of games and lab apps (tests/fixtures/catalog.json). FOLIO_GITHUB=fixture forces both.
   Games and lab apps come from the Folio controller's public catalog (FOLIO_CATALOG_URL), which lists an app once it
   is deployed; an unreachable catalog fails the build like an unreachable GitHub. A failed request fails the build, so production keeps its
   last good version. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { Snapshot } from '../src/content/discover.ts';
import { type Node, type Pin, publicData } from './github-data.ts';

const OWNER = process.env.FOLIO_OWNER ?? 'Contraill';
const SELF = (process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'Folio').toLowerCase();
const OUT = '.folio/github.json';
const FIXTURE = 'tests/fixtures/github.json';
const CATALOG = 'tests/fixtures/catalog.json';
const CATALOG_URL = process.env.FOLIO_CATALOG_URL ?? 'https://folio-controller.i-canoztozlu.workers.dev/catalog.json';
mkdirSync('.folio', { recursive: true });

const token = process.env.GITHUB_TOKEN;
if (process.env.FOLIO_GITHUB === 'fixture' || !token) {
  if (!token && process.env.CI && process.env.FOLIO_GITHUB !== 'fixture') {
    console.error('GITHUB_TOKEN is missing: refusing to build without GitHub data.');
    process.exit(1);
  }
  const recorded: Snapshot = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  recorded.apps = JSON.parse(readFileSync(CATALOG, 'utf8')).apps;
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
        name isPrivate description homepageUrl pushedAt createdAt stargazerCount
        primaryLanguage { name } openGraphImageUrl usesCustomOpenGraphImage
        repositoryTopics(first: 20) { nodes { topic { name } } }
        folioYaml: object(expression: "HEAD:.github/folio.yaml") { ... on Blob { text } }
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
const apps = ((await catalog.json()) as { apps: unknown[] }).apps;
if (!Array.isArray(apps)) throw new Error('The app catalog has no list of apps');
const snapshot: Snapshot = { fetchedAt: new Date().toISOString(), source: 'live', owner: OWNER, repos, pins, apps };
writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n');
const tagged = (t: string) => repos.filter((r) => r.topics.includes(t)).length;
console.log(`GitHub: ${repos.length} public repositories, ${snapshot.pins.length} pins, ${tagged('folio')} with the folio topic; catalog: ${apps.length} apps.`);
