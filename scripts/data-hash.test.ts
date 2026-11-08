import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type { Snapshot } from '../src/content/discover.ts';
import { dataHash } from './data-hash.ts';

const recorded: Snapshot = JSON.parse(readFileSync(new URL('../tests/fixtures/github.json', import.meta.url), 'utf8'));

test('the data hash ignores when the data was read, and changes with anything published', () => {
  const later = { ...recorded, fetchedAt: '2030-01-01T00:00:00Z', source: 'live' as const };
  assert.equal(dataHash(later), dataHash(recorded));
  const renamed = structuredClone(recorded);
  renamed.repos[0].description = 'new words';
  assert.notEqual(dataHash(renamed), dataHash(recorded));
  assert.notEqual(dataHash({ ...recorded, pins: [...recorded.pins].reverse() }), dataHash(recorded), 'a new pin order is a change');
  assert.notEqual(dataHash({ ...recorded, apps: [{ id: 'x' }] }), dataHash(recorded));
});
