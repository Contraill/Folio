import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { seedStatements } from '../seed/index.ts';
import { toSql } from '../src/content/store.ts';
import { fingerprint, type Query } from './fingerprint.ts';

function seededStore() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_content.sql', import.meta.url), 'utf8'));
  sqlite.exec(toSql(seedStatements('2026-11-06T00:00:00.000Z')));
  const query: Query = (sql) => sqlite.prepare(sql).all() as never;
  return { sqlite, hash: () => fingerprint(query).hash, probe: () => fingerprint(query).probe };
}

test('the fingerprint changes with anything that decides what the site shows', () => {
  for (const change of [
    "UPDATE entry SET visibility = 'unlisted' WHERE id = 'project:helios'",
    "UPDATE entry SET deleted_at = '2026-11-07' WHERE id = 'page:secret'",
    "UPDATE project SET listed = 0 WHERE id = 'bct'",
    "UPDATE project SET sort_rank = 99 WHERE id = 'huepr'",
    "UPDATE project SET featured_rank = NULL WHERE id = 'mochi'",
    "UPDATE project SET selected_rank = 9 WHERE id = 'orbis'",
    "UPDATE project SET repo_id = 42 WHERE id = 'helios'",
    "UPDATE entry_locale SET published_at = '2026-11-07' WHERE entry_id = 'page:about' AND locale = 'tr'",
    "UPDATE entry_locale SET published_id = NULL WHERE entry_id = 'page:about' AND locale = 'tr'",
    "UPDATE meta SET value = 'another day' WHERE key = 'seeded_at'",
  ]) {
    const { sqlite, hash } = seededStore();
    const before = hash();
    sqlite.exec(change);
    assert.notEqual(hash(), before, change);
  }
});

test('runtime state and the deploy probe leave the fingerprint alone', () => {
  const { sqlite, hash, probe } = seededStore();
  const before = hash();
  sqlite.exec("UPDATE meta SET value = 'on' WHERE key = 'page_cache'");
  sqlite.exec("UPDATE meta SET value = '57' WHERE key = 'cache_generation'");
  sqlite.exec("INSERT INTO meta (key, value) VALUES ('deploy_probe', 'abc')");
  assert.equal(hash(), before);
  assert.equal(probe(), 'abc');
});
