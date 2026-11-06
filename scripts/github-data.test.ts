import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type Node, publicData } from './github-data.ts';

const node = (name: string, isPrivate: boolean): Node => ({
  name, isPrivate, description: null, homepageUrl: '', pushedAt: '2026-11-01T00:00:00Z', createdAt: '2026-01-01T00:00:00Z', stargazerCount: 0,
  primaryLanguage: null, openGraphImageUrl: null, usesCustomOpenGraphImage: false, repositoryTopics: { nodes: [{ topic: { name: 'folio' } }] }, folioYaml: null,
});

test('only public repositories and pins are kept, never Folio itself', () => {
  const { repos, pins } = publicData([node('Open', false), node('Hidden', true), node('Folio', false)], [{ name: 'Hidden', isPrivate: true }, { name: 'Open', isPrivate: false }, { name: 'folio', isPrivate: false }], 'Folio');
  assert.deepEqual(repos.map((r) => r.name), ['Open']);
  assert.deepEqual(pins, ['Open']);
  assert.ok(!JSON.stringify({ repos, pins }).includes('Hidden'));
  assert.equal(repos[0].homepageUrl, null, 'an empty homepage is no homepage');
});
