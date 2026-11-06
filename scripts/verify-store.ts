/* Checks against a real database that its content survives what could go wrong. usage:
     node scripts/verify-store.ts local|preview repeat-seed        the seed SQL, run again without the tool's check, writes nothing
     node scripts/verify-store.ts local|preview failed-migration   a migration that fails half-way leaves no trace
     node scripts/verify-store.ts local|preview fingerprint        prints a summary of everything stored, to compare across a deploy
     node scripts/verify-store.ts local|preview probe              leaves a marker to look for after a deploy
   There is no production target. */
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { seedStatements } from '../seed/index.ts';
import { toSql } from '../src/content/store.ts';

const root = resolve(import.meta.dirname, '..');
const DATABASES: Record<string, { name: string; id: string; where: string[] }> = {
  local: { name: 'folio-local', id: 'local-only', where: ['--local', '--persist-to', join(root, '.wrangler/state')] },
  preview: { name: 'folio-preview', id: '6b36ecbe-b860-4df3-92c5-188a49af172b', where: ['--remote'] },
};
const [target, check] = process.argv.slice(2);
const db = DATABASES[target];
if (!db) throw new Error('target must be local or preview');

const tmp = mkdtempSync(join(tmpdir(), 'folio-verify-'));
const config = (migrationsDir: string) => {
  const file = join(tmp, `wrangler-${randomUUID()}.json`);
  writeFileSync(file, JSON.stringify({ name: 'folio-verify', d1_databases: [{ binding: 'DB', database_name: db.name, database_id: db.id, migrations_dir: migrationsDir }] }));
  return file;
};
const base = config(join(root, 'migrations'));
const wrangler = (args: string[]) => execFileSync('pnpm', ['exec', 'wrangler', ...args], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const query = <T>(sql: string): T[] => JSON.parse(wrangler(['d1', 'execute', db.name, ...db.where, '--config', base, '--json', '--command', sql]))[0].results;
const fails = (args: string[]) => { try { wrangler(args); return false; } catch { return true; } };

function fingerprint() {
  const [counts] = query<Record<string, number | string>>("SELECT (SELECT count(*) FROM entry) AS entries, (SELECT count(*) FROM revision) AS revisions, (SELECT count(*) FROM project) AS projects, (SELECT value FROM meta WHERE key = 'seeded_at') AS seeded_at, (SELECT value FROM meta WHERE key = 'deploy_probe') AS probe");
  const rows = query<{ id: string; body: string }>('SELECT id, body FROM revision ORDER BY id');
  const pointers = query<Record<string, string>>('SELECT entry_id, locale, draft_id, published_id FROM entry_locale ORDER BY entry_id, locale');
  const hash = createHash('sha256').update(JSON.stringify([rows, pointers])).digest('hex').slice(0, 16);
  return { ...counts, hash };
}

try {
  if (check === 'fingerprint') console.log(JSON.stringify(fingerprint()));
  else if (check === 'probe') {
    const probe = randomUUID();
    query(`INSERT INTO meta (key, value) VALUES ('deploy_probe', '${probe}') ON CONFLICT (key) DO UPDATE SET value = excluded.value`);
    console.log(JSON.stringify(fingerprint()));
  } else if (check === 'repeat-seed') {
    const before = fingerprint();
    const file = join(tmp, 'seed.sql');
    writeFileSync(file, toSql(seedStatements()));
    const refused = fails(['d1', 'execute', db.name, ...db.where, '--config', base, '--yes', '--file', file]);
    const after = fingerprint();
    console.log(JSON.stringify({ refused, unchanged: JSON.stringify(before) === JSON.stringify(after), before, after }));
    if (!refused || JSON.stringify(before) !== JSON.stringify(after)) process.exit(1);
  } else if (check === 'failed-migration') {
    const dir = join(tmp, 'migrations');
    cpSync(join(root, 'migrations'), dir, { recursive: true });
    writeFileSync(join(dir, '9999_fails_half_way.sql'), 'CREATE TABLE verify_probe (id INTEGER);\nINSERT INTO verify_probe VALUES (1);\nINSERT INTO table_that_does_not_exist VALUES (1);\n');
    const before = fingerprint();
    const failed = fails(['d1', 'migrations', 'apply', db.name, ...db.where, '--config', config(dir)]);
    const leftovers = query<{ name: string }>("SELECT name FROM sqlite_master WHERE name = 'verify_probe'");
    const recorded = query<{ name: string }>("SELECT name FROM d1_migrations WHERE name LIKE '9999%'");
    const after = fingerprint();
    const ok = failed && !leftovers.length && !recorded.length && JSON.stringify(before) === JSON.stringify(after);
    console.log(JSON.stringify({ failed, tableLeftBehind: leftovers.length > 0, migrationRecorded: recorded.length > 0, contentUnchanged: JSON.stringify(before) === JSON.stringify(after) }));
    if (leftovers.length) query('DROP TABLE verify_probe');
    if (!ok) process.exit(1);
  } else throw new Error('unknown check');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
