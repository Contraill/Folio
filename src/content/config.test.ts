import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

/* The Worker's configuration, checked as configuration: what production and Previews may reach, and what passes the Worker. */
const config = JSON.parse(readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
const STORAGE = ['d1_databases', 'kv_namespaces', 'r2_buckets', 'hyperdrive', 'vectorize', 'queues', 'durable_objects', 'secrets_store_secrets'];

test('production has no storage bindings and no shared cache', () => {
  for (const key of STORAGE) assert.equal(config[key], undefined, key);
  assert.equal(config.cache, undefined);
});

test('Previews keep only the old Preview database, unused, and no shared cache', () => {
  assert.deepEqual(config.previews.d1_databases.map((d: Record<string, string>) => d.database_name), ['folio-preview']);
  for (const key of STORAGE.filter((k) => k !== 'd1_databases')) assert.equal(config.previews[key], undefined, key);
  assert.equal(config.previews.cache.enabled, false);
});

test('pages and the internal prefix always pass the language Worker', () => {
  const rules: string[] = config.assets.run_worker_first;
  assert.equal(rules[0], '/*');
  const skipped = rules.filter((r) => r.startsWith('!')).map((r) => new RegExp(`^${r.slice(1).replace(/[.]/g, '\\.').replace(/\*/g, '.*')}$`));
  for (const path of ['/', '/about', '/about/index.html', '/cv', '/cv/', '/cv/index.html', '/__tr/about', '/__tr/cv/index.html', '/search-index.json', '/uses'])
    assert.ok(!skipped.some((re) => re.test(path)), `${path} must reach the Worker`);
  for (const path of ['/_astro/x.js', '/cv/en.pdf', '/fonts/geist.woff2', '/_build.json']) assert.ok(skipped.some((re) => re.test(path)), `${path} is a static file`);
});
