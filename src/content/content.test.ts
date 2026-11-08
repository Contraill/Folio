import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parse } from 'yaml';
import { PAGE_GROUPS, PageBodies, ProjectEntry, ProjectTranslation } from './schema.ts';

/* The same checks the build makes, plus the rules the content follows. */
const frontmatter = (url: URL) => {
  const match = /^---\n([\s\S]*?)\n---/.exec(readFileSync(url, 'utf8'));
  assert.ok(match, `${url.pathname} has no frontmatter`);
  return parse(match[1]);
};
const at = (path: string) => new URL(path, import.meta.url);
const pages = Object.fromEntries(PAGE_GROUPS.map((g) => [g, { en: frontmatter(at(`./pages/${g}/en.md`)), tr: frontmatter(at(`./pages/${g}/tr.md`)) }]));
const projectIds = readdirSync(at('./projects/'));
const projects = projectIds.map((id) => ({ id, en: ProjectEntry.parse(frontmatter(at(`./projects/${id}/en.md`))), tr: ProjectTranslation.parse(frontmatter(at(`./projects/${id}/tr.md`))) }));
const texts = (value: unknown): string[] => (typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(texts) : []);
const shape = (value: unknown): unknown => (Array.isArray(value) ? value.map(shape) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)])) : typeof value);
const inPublic = (src: string) => existsSync(new URL(`../../public${src}`, import.meta.url));

test('every page group fits its schema, in both languages', () => {
  for (const g of PAGE_GROUPS) for (const lang of ['en', 'tr'] as const) assert.doesNotThrow(() => PageBodies[g].parse(pages[g][lang]), `${g}/${lang}`);
});

test('both languages have the same structure', () => {
  for (const g of PAGE_GROUPS) assert.deepEqual(shape(pages[g].tr), shape(pages[g].en), g);
  for (const p of projects) if (p.en.case) assert.equal(p.tr.case?.sections.length, p.en.case.sections.length, p.id);
});

test('copy never describes a device or an input method', () => {
  const words = /\b(tap|taps|click|clicks|hover|drag|drags|swipe|pointer|mouse|cursor|scroll|phone|mobile|t[ıi]kla\w*|s[üu]r[üu]kle\w*|kayd[ıi]r\w*|fareyle)\b/i;
  for (const text of texts(pages)) assert.doesNotMatch(text, words, text);
});

test('now and secret are the unlisted pages, in both languages', () => {
  const unlisted = (lang: 'en' | 'tr') => PAGE_GROUPS.filter((g) => pages[g][lang].visibility === 'unlisted');
  assert.deepEqual(unlisted('en'), ['now', 'secret']);
  assert.deepEqual(unlisted('tr'), unlisted('en'));
});

test('no placeholder is left in the copy: no brackets to fill in, no to-do notes', () => {
  const placeholder = /^\[.*\]$|\b(todo|tbd|lorem|placeholder|goes here)\b|buraya gelecek/i;
  for (const text of [...texts(pages), ...texts(projects)]) assert.doesNotMatch(text, placeholder, text);
});

test('projects written in Folio fit their schema, link their repository by id, and their images exist', () => {
  const recorded = JSON.parse(readFileSync(new URL('../../tests/fixtures/github.json', import.meta.url), 'utf8')) as { repos: { id: number; name: string }[] };
  const orders = projects.flatMap((p) => (p.en.order === undefined ? [] : [p.en.order]));
  assert.equal(new Set(orders).size, orders.length, 'order ranks are unique');
  for (const p of projects) {
    for (const im of [p.en.img, p.en.hero, ...(p.en.case?.sections.flatMap((s) => s.gal?.map(([g]) => g) ?? []) ?? [])]) if (im) assert.ok(inPublic(im.src), `${p.id}: ${im.src}`);
    assert.ok(p.tr.desc, `${p.id} has Turkish text`);
    if (p.en.repo) assert.equal(recorded.repos.find((r) => r.id === p.en.repoId)?.name, p.en.repo, `${p.id}: repoId matches ${p.en.repo}`);
  }
});
