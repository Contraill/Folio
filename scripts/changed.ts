/* For a scheduled or controller-started sync: has anything changed since the live build? Reads the GitHub snapshot
   this run just fetched (.folio/github.json) and the live /_build.json, and writes `skip=true` to the step's output
   when the live build is this commit with the same data. Any doubt (no live build, an error, another commit) means a
   full build. The Access token, when set, goes only to the Preview's own host. */
import { execSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import type { Snapshot } from '../src/content/discover.ts';
import { dataHash } from './data-hash.ts';

const [liveUrl] = process.argv.slice(2);
const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
const local = dataHash(JSON.parse(readFileSync('.folio/github.json', 'utf8')) as Snapshot);
let skip = false;
try {
  const headers: Record<string, string> = {};
  if (process.env.CF_ACCESS_CLIENT_ID) {
    headers['cf-access-client-id'] = process.env.CF_ACCESS_CLIENT_ID;
    headers['cf-access-client-secret'] = process.env.CF_ACCESS_CLIENT_SECRET ?? '';
  }
  const res = await fetch(liveUrl, { headers, redirect: 'manual' });
  if (res.ok) {
    const live = (await res.json()) as { sha?: string; data?: string };
    skip = live.sha === commit && live.data === local;
    console.log(skip ? 'Nothing changed since the live build: skipping the deploy.' : `Changed: ${live.sha === commit ? 'GitHub data' : 'another commit is live'}.`);
  } else console.log(`The live build answered ${res.status}: building.`);
} catch (e) {
  console.log(`The live build could not be read (${(e as Error).message}): building.`);
}
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `skip=${skip}\n`);
