import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

/* Production and Previews never share data: the configuration itself is checked, not only the code. */
const jsonc = (file: string) => JSON.parse(readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
const config = jsonc('wrangler.jsonc');
const migrations = jsonc('wrangler.preview-migrations.jsonc');
const STORAGE = ['d1_databases', 'kv_namespaces', 'r2_buckets', 'hyperdrive', 'vectorize', 'queues', 'durable_objects', 'secrets_store_secrets'];
const PREVIEW_DB = { binding: 'DB', database_name: 'folio-preview', database_id: '6b36ecbe-b860-4df3-92c5-188a49af172b' };

test('production has no storage bindings and no shared page cache yet', () => {
  for (const key of STORAGE) assert.equal(config[key], undefined, key);
  assert.equal(config.vars.PAGE_CACHE, 'off');
  assert.equal(config.cache.enabled, false);
});

test('Previews reach the Preview database only', () => {
  assert.deepEqual(config.previews.d1_databases, [PREVIEW_DB]);
  for (const key of STORAGE.filter((k) => k !== 'd1_databases')) assert.equal(config.previews[key], undefined, key);
  assert.deepEqual(migrations.d1_databases.map(({ migrations_dir: _, ...db }: Record<string, string>) => db), [PREVIEW_DB]);
  assert.equal(migrations.main, undefined, 'the migrations config must not be deployable');
});

test('local development uses a local file only', () => {
  assert.deepEqual(config.env.local.d1_databases.map((d: Record<string, string>) => d.database_id), ['local-only']);
});

test('the gateway itself is never cached', () => {
  assert.deepEqual(config.exports.default.cache, { enabled: false });
});
