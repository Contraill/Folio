import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { seedStatements } from '../../seed/index.ts';
import { casesFor } from '../../seed/cases.ts';
import { CV_PROJECTS, CV_TEXT } from '../../seed/cv.ts';
import { pages } from '../../seed/pages.ts';
import { FEATURED, pickPublished, PUBLISHED, publishedProjects, SELECTED } from '../../seed/projects.ts';
import { type Db, loadContent, publishDraft, publishRevision, run, saveDraft, type Stmt, toSql, unpublish } from './store.ts';

/* An in-memory SQLite with the real migrations, behind the same calls as a D1 binding. */
function store() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec(readFileSync(new URL('../../migrations/0001_content.sql', import.meta.url), 'utf8'));
  const statement = (sql: string, values: unknown[] = []): Stmt => ({
    all: async <T>() => ({ results: sqlite.prepare(sql).all(...(values as never[])) as T[] }),
    first: async <T>() => (sqlite.prepare(sql).get(...(values as never[])) ?? null) as T | null,
    run: async () => sqlite.prepare(sql).run(...(values as never[])),
  });
  const db: Db = {
    prepare: (sql) => ({ ...statement(sql), bind: (...values) => statement(sql, values) }),
    batch: async (statements) => {
      sqlite.exec('BEGIN');
      try { for (const s of statements) await s.run(); sqlite.exec('COMMIT'); } catch (e) { sqlite.exec('ROLLBACK'); throw e; }
    },
  };
  const count = (table: string) => (sqlite.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number }).n;
  const meta = (key: string) => (sqlite.prepare('SELECT value FROM meta WHERE key = ?').get(key) as { value: string } | undefined)?.value;
  return { sqlite, db, count, meta };
}

async function seeded() {
  const s = store();
  await run(s.db, seedStatements('2026-11-06T00:00:00.000Z'));
  return s;
}

test('the seed loads every entry into an empty store, published in both languages', async () => {
  const { count, meta } = await seeded();
  assert.equal(count('entry'), 12 + 1 + 14); // page copy, the CV, every project
  assert.equal(count('revision'), 2 * 27);
  assert.equal(count('project'), 14);
  assert.ok(meta('seeded_at'));
  assert.equal(meta('page_cache'), 'off');
});

test('the store gives the site exactly what the static files did', async () => {
  const { db } = await seeded();
  for (const locale of ['en', 'tr'] as const) {
    const c = await loadContent(db, locale);
    assert.deepEqual(c.pages, pages[locale]);
    assert.deepEqual(c.projects, publishedProjects(locale));
    assert.deepEqual(c.projects.map((p) => p.id), PUBLISHED);
    assert.deepEqual(c.featured, pickPublished(publishedProjects(locale), FEATURED));
    assert.deepEqual(c.selected, pickPublished(publishedProjects(locale), SELECTED));
    assert.deepEqual(c.cv, { text: CV_TEXT[locale], projects: CV_PROJECTS[locale] });
    for (const id of PUBLISHED) assert.deepEqual(c.cases[id], casesFor(locale)[id], id);
    // Key order matters for rendering, so compare it too.
    assert.equal(JSON.stringify(c.projects), JSON.stringify(publishedProjects(locale)));
    assert.equal(JSON.stringify(c.pages), JSON.stringify(pages[locale]));
  }
});

test('the seed refuses a store that already has content, and changes nothing', async () => {
  const { db, count } = await seeded();
  await assert.rejects(run(db, seedStatements()), /UNIQUE/);
  assert.equal(count('entry'), 27);
  assert.equal(count('revision'), 54);
});

test('the seed as a SQL file writes the same thing, quotes included', async () => {
  const { sqlite, db, count } = store();
  sqlite.exec(toSql(seedStatements()));
  assert.equal(count('revision'), 54);
  assert.deepEqual((await loadContent(db, 'tr')).pages, pages.tr);
});

test('revisions can never be changed or deleted', async () => {
  const { sqlite } = await seeded();
  assert.throws(() => sqlite.exec("UPDATE revision SET body = '{}'"), /immutable/);
  assert.throws(() => sqlite.exec('DELETE FROM revision'), /immutable/);
});

test('a draft stays off the site until published, and any earlier revision can come back', async () => {
  const { db, meta } = await seeded();
  const about = { id: 'page:about', type: 'page', slug: 'about' };
  const before = await loadContent(db, 'en');
  const generation = Number(meta('cache_generation'));
  const published = (await db.prepare("SELECT published_id AS id FROM entry_locale WHERE entry_id = 'page:about' AND locale = 'en'").first<{ id: string }>())!.id;

  await run(db, saveDraft(about, 'en', { ...before.pages.about, title: 'About, revised' }, 'test'));
  assert.equal((await loadContent(db, 'en')).pages.about.title, 'About');
  assert.equal(Number(meta('cache_generation')), generation);

  await run(db, publishDraft('page:about', 'en'));
  assert.equal((await loadContent(db, 'en')).pages.about.title, 'About, revised');
  assert.equal((await loadContent(db, 'tr')).pages.about.title, pages.tr.about.title);
  assert.equal(Number(meta('cache_generation')), generation + 1);

  await run(db, publishRevision('page:about', 'en', published));
  assert.equal((await loadContent(db, 'en')).pages.about.title, 'About');
  assert.equal(Number(meta('cache_generation')), generation + 2);

  const cvRevision = (await db.prepare("SELECT published_id AS id FROM entry_locale WHERE entry_id = 'cv:cv' AND locale = 'en'").first<{ id: string }>())!.id;
  await assert.rejects(run(db, publishRevision('page:about', 'en', cvRevision)), /another entry/);
  await assert.rejects(run(db, publishRevision('page:about', 'tr', published)), /another entry/);
});

test('a body that does not fit its schema is refused before anything is written', async () => {
  const { db, count } = await seeded();
  const about = { id: 'page:about', type: 'page', slug: 'about' };
  const good = (await loadContent(db, 'en')).pages.about;
  const { title: _, ...missing } = good;
  assert.throws(() => saveDraft(about, 'en', missing, 'test'));
  assert.throws(() => saveDraft(about, 'en', { ...good, script: '<script>' }, 'test'));
  assert.throws(() => saveDraft({ id: 'project:helios', type: 'project', slug: 'helios' }, 'en', { name: 'Helios' }, 'test'));
  assert.equal(count('revision'), 54);
});

test('Turkish falls back to English when it has nothing published', async () => {
  const { db } = await seeded();
  await run(db, unpublish('page:about', 'tr'));
  assert.deepEqual((await loadContent(db, 'tr')).pages.about, pages.en.about);
});

test('candidates, private and deleted entries never reach the site', async () => {
  const { sqlite, db } = await seeded();
  const ids = async () => (await loadContent(db, 'en')).projects.map((p) => p.id);
  assert.ok(!(await ids()).includes('nodesk'), 'candidates stay off');
  sqlite.exec("UPDATE entry SET visibility = 'private' WHERE id = 'project:helios'");
  sqlite.exec("UPDATE entry SET deleted_at = '2026-11-06' WHERE id = 'project:orbis'");
  assert.deepEqual(await ids(), PUBLISHED.filter((id) => id !== 'helios' && id !== 'orbis'));
  const c = await loadContent(db, 'en');
  assert.ok(!c.featured.some((p) => p.id === 'helios') && !('helios' in c.cases));
});

test('an unlisted project stays out of every list, even when listed is on', async () => {
  const { sqlite, db } = await seeded();
  sqlite.exec("UPDATE entry SET visibility = 'unlisted' WHERE id IN ('project:helios', 'project:orbis')");
  assert.equal((sqlite.prepare("SELECT listed FROM project WHERE id = 'helios'").get() as { listed: number }).listed, 1);
  for (const locale of ['en', 'tr'] as const) {
    const c = await loadContent(db, locale);
    const ids = (list: { id: string }[]) => list.map((p) => p.id);
    assert.deepEqual(ids(c.projects), PUBLISHED.filter((id) => id !== 'helios' && id !== 'orbis'), 'projects and the search index');
    assert.ok(!ids(c.featured).includes('helios'), 'featured');
    assert.ok(!ids(c.selected).includes('orbis'), 'selected');
    assert.ok(!('helios' in c.cases) && !('orbis' in c.cases), 'case studies');
    assert.deepEqual(c.pages.uses, pages[locale].uses, 'unlisted pages still load by address');
  }
});
