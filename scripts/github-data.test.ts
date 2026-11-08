import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type Node, publicData } from './github-data.ts';

const node = (name: string, isPrivate: boolean, id = 1): Node => ({
  databaseId: id, name, isPrivate, isTemplate: false, isFork: false, isArchived: false, description: '', homepageUrl: '', pushedAt: '2026-11-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z', stargazerCount: 0, primaryLanguage: null, languages: { nodes: [{ name: 'TypeScript' }, { name: 'CSS' }] },
  openGraphImageUrl: null, usesCustomOpenGraphImage: false, repositoryTopics: { nodes: [] },
  defaultBranchRef: { target: { messageHeadline: `${name}: fix`, committedDate: '2026-11-01T10:00:00Z', url: `https://github.com/me/${name}/commit/abc` } },
});

test('only public repositories and pins are kept, never Folio itself', () => {
  const { repos, pins } = publicData([node('Open', false), node('Hidden', true), node('Folio', false)], [{ name: 'Hidden', isPrivate: true }, { name: 'Open', isPrivate: false }, { name: 'folio', isPrivate: false }], 'Folio');
  assert.deepEqual(repos.map((r) => r.name), ['Open']);
  assert.deepEqual(pins, ['Open']);
  assert.ok(!JSON.stringify({ repos, pins }).includes('Hidden'), 'not even a private commit message');
  assert.equal(repos[0].homepageUrl, null, 'an empty homepage is no homepage');
  assert.equal(repos[0].description, null, 'an empty description is no description');
  assert.deepEqual(repos[0].languages, ['TypeScript', 'CSS']);
  assert.deepEqual(repos[0].lastCommit, { message: 'Open: fix', date: '2026-11-01T10:00:00Z', url: 'https://github.com/me/Open/commit/abc' });
});

test('an empty repository has no last commit', () => {
  const { repos } = publicData([{ ...node('Empty', false), defaultBranchRef: null }], [], 'Folio');
  assert.equal(repos[0].lastCommit, null);
});
