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

test('uses, now and secret are the unlisted pages, in both languages', () => {
  const unlisted = (lang: 'en' | 'tr') => PAGE_GROUPS.filter((g) => pages[g][lang].visibility === 'unlisted');
  assert.deepEqual(unlisted('en'), ['uses', 'now', 'secret']);
  assert.deepEqual(unlisted('tr'), unlisted('en'));
});

test('projects written in Folio fit their schema, and their images exist', () => {
  assert.equal(projects.filter((p) => p.en.listed).length, 7, 'the seven projects listed before GitHub topics');
  for (const key of ['order', 'featured', 'selected'] as const) {
    const ranks = projects.flatMap((p) => (p.en[key] === undefined ? [] : [p.en[key]]));
    assert.equal(new Set(ranks).size, ranks.length, `${key} ranks are unique`);
  }
  for (const p of projects) {
    for (const im of [p.en.img, p.en.hero, ...(p.en.case?.sections.flatMap((s) => s.gal?.map(([g]) => g) ?? []) ?? [])]) if (im) assert.ok(inPublic(im.src), `${p.id}: ${im.src}`);
    if (p.en.listed) assert.notEqual(p.tr.desc, undefined, `${p.id} has Turkish text`);
  }
});
