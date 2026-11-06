/* Loads the first content into an empty store: `pnpm db:seed:local` or `pnpm db:seed:preview`.
   It refuses a store that has any content, and the SQL itself fails before writing if the store was ever seeded.
   There is no production target: production gets its database, migrations and content at the cutover. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { seedStatements } from '../seed/index.ts';
import { toSql } from '../src/content/store.ts';

const TARGETS: Record<string, string[]> = {
  local: ['folio-local', '--local', '--env', 'local'],
  preview: ['folio-preview', '--remote', '--config', 'wrangler.preview-migrations.jsonc'],
};
const target = TARGETS[process.argv[2]];
if (!target) {
  console.error('usage: node scripts/seed.ts local|preview');
  process.exit(2);
}
const d1 = (...args: string[]) => execFileSync('pnpm', ['exec', 'wrangler', 'd1', 'execute', ...target, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });

const [{ results }] = JSON.parse(d1('--json', '--command', "SELECT (SELECT count(*) FROM entry) + (SELECT count(*) FROM revision) + (SELECT count(*) FROM meta WHERE key = 'seeded_at') AS n"));
if (results[0].n > 0) {
  console.error(`Refusing to seed ${target[0]}: it already has content. Seeding only ever fills an empty store.`);
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), 'folio-seed-'));
try {
  const file = join(dir, 'seed.sql');
  writeFileSync(file, toSql(seedStatements()));
  d1('--yes', '--file', file);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
const [{ results: after }] = JSON.parse(d1('--json', '--command', 'SELECT (SELECT count(*) FROM entry) AS entries, (SELECT count(*) FROM revision) AS revisions'));
console.log(`Seeded ${target[0]}: ${after[0].entries} entries, ${after[0].revisions} revisions.`);
