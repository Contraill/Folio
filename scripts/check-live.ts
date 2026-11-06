/* After a production deploy: the live /_build.json must name exactly this build. It retries while the new version
   spreads, then fails, so a deploy that didn't take shows up as a failed job and a notification.
   usage: node scripts/check-live.ts <site URL> <dist/_build.json> */
import { readFileSync } from 'node:fs';

const [site, file] = process.argv.slice(2);
const built = JSON.parse(readFileSync(file, 'utf8'));
for (let attempt = 1; attempt <= 12; attempt++) {
  try {
    const live = (await (await fetch(`${site}/_build.json`, { headers: { 'cache-control': 'no-cache' } })).json()) as { sha?: string; builtAt?: string };
    if (live.sha === built.sha && live.builtAt === built.builtAt) {
      console.log(`Live: ${built.sha.slice(0, 7)}, built ${built.builtAt}.`);
      process.exit(0);
    }
    console.log(`Attempt ${attempt}: live is ${String(live.sha).slice(0, 7)} built ${live.builtAt}; waiting.`);
  } catch (e) {
    console.log(`Attempt ${attempt}: ${(e as Error).message}`);
  }
  await new Promise((r) => setTimeout(r, 10_000));
}
console.error(`Production does not serve ${built.sha.slice(0, 7)} built ${built.builtAt}.`);
process.exit(1);
