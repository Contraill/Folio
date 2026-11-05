import assert from 'node:assert/strict';
import { test } from 'node:test';
import { casesFor } from './cases.ts';
import { pages } from './pages.ts';
import { FEATURED, pickPublished, PROJECTS, PUBLISHED, publishedProjects, SELECTED } from './projects.ts';

const texts = (value: unknown): string[] => (typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(texts) : []);
const shape = (value: unknown): unknown => (Array.isArray(value) ? value.map(shape) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)])) : typeof value);

test('both languages have the same structure', () => {
  assert.deepEqual(shape(pages.tr), shape(pages.en));
  for (const id of Object.keys(casesFor('en'))) assert.equal(casesFor('tr')[id].sections.length, casesFor('en')[id].sections.length, id);
});

test('copy never describes a device or an input method', () => {
  const words = /\b(tap|taps|click|clicks|hover|drag|drags|swipe|pointer|mouse|cursor|scroll|phone|mobile|t[ıi]kla\w*|s[üu]r[üu]kle\w*|kayd[ıi]r\w*|fareyle)\b/i;
  for (const text of texts(pages)) assert.doesNotMatch(text, words, text);
});

test('only published projects are public, in their order', () => {
  const all = [{ id: 'a' }, { id: 'b' }, { id: 'c' }] as never[];
  assert.deepEqual(pickPublished(all, ['c', 'a', 'missing']).map((p: { id: string }) => p.id), ['c', 'a']);
  assert.deepEqual(publishedProjects('en').map((p) => p.id), PUBLISHED);
  assert.ok(PROJECTS.length > PUBLISHED.length, 'some candidates stay unpublished');
});

test('featured and selected come from the published set', () => {
  for (const id of [...FEATURED, ...SELECTED]) assert.ok(PUBLISHED.includes(id), id);
  for (const id of PUBLISHED) assert.ok(PROJECTS.some((p) => p.id === id), id);
});

test('every project is translated', () => {
  const en = publishedProjects('en'), tr = publishedProjects('tr');
  en.forEach((p, i) => assert.notEqual(tr[i].desc, p.desc, p.id));
});
