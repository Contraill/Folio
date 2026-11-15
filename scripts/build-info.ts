/* After `astro build`: dist/_build.json names the build (the commit that was built, and when), so a deploy can be
   checked against what is live (scripts/check-live.ts, tests/e2e/preflight.ts). */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const sha = execSync('git rev-parse HEAD').toString().trim();
writeFileSync('dist/_build.json', JSON.stringify({ sha, builtAt: new Date().toISOString() }, null, 2) + '\n');
