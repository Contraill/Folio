/* Content store access. Public reads take published revisions only, and every public page loads its content
   through loadContent. Writes go through the statement builders below, which check bodies first.
   Relative imports only: the seed tool and the unit tests load this file in Node. */
import type { Locale } from '../i18n/locale.ts';
import { type Case, type Cv, type Pages, PAGE_SLUGS, type Project, SCHEMA_VERSION, schemaFor } from './schema.ts';

/* The part of a D1 binding used here; the unit tests stand in Node's SQLite. */
export interface Stmt { all<T = Record<string, unknown>>(): Promise<{ results: T[] }>; first<T = Record<string, unknown>>(): Promise<T | null>; run(): Promise<unknown> }
export interface Db { prepare(sql: string): { bind(...values: unknown[]): Stmt } & Stmt; batch(statements: Stmt[]): Promise<unknown> }

export type Content = { pages: Pages; projects: Project[]; featured: Project[]; selected: Project[]; cases: Record<string, Case>; cv: Cv };

type Row = { type: string; slug: string; visibility: 'public' | 'unlisted'; locale: Locale; rev: string; listed: number | null; sort_rank: number | null; featured_rank: number | null; selected_rank: number | null };

/* Published revisions of everything not private or deleted, in the asked language and in English, the fallback. */
const MANIFEST = `SELECT e.type, e.slug, e.visibility, l.locale, l.published_id AS rev, p.listed, p.sort_rank, p.featured_rank, p.selected_rank
  FROM entry e JOIN entry_locale l ON l.entry_id = e.id LEFT JOIN project p ON p.entry_id = e.id
  WHERE e.deleted_at IS NULL AND e.visibility IN ('public', 'unlisted') AND l.published_id IS NOT NULL AND l.locale IN ('en', ?1)`;

/* Revisions never change, so a body that passed its schema once is kept for the life of the isolate. Which
   revisions a request may see is decided by the manifest query, never by this map. */
const checked = new Map<string, unknown>();

export async function loadContent(db: Db, locale: Locale): Promise<Content> {
  const { results: rows } = await db.prepare(MANIFEST).bind(locale).all<Row>();
  const missing = [...new Set(rows.map((r) => r.rev))].filter((id) => !checked.has(id));
  if (missing.length) {
    const { results } = await db
      .prepare('SELECT r.id, r.locale, r.body, e.type, e.slug FROM revision r JOIN entry e ON e.id = r.entry_id WHERE r.id IN (SELECT value FROM json_each(?1))')
      .bind(JSON.stringify(missing))
      .all<{ id: string; locale: string; body: string; type: string; slug: string }>();
    if (checked.size > 2000) checked.clear();
    for (const r of results) {
      const body = JSON.parse(r.body);
      schemaFor(r.type, r.slug, r.locale).parse(body);
      checked.set(r.id, body);
    }
  }
  const body = (type: string, slug: string, lang: Locale) => {
    const row = rows.find((r) => r.type === type && r.slug === slug && r.locale === lang);
    return row ? checked.get(row.rev) : undefined;
  };
  const localized = (type: string, slug: string) => {
    const value = body(type, slug, locale) ?? body(type, slug, 'en');
    if (value === undefined) throw new Error(`no published ${type}/${slug}`);
    return value;
  };

  const pages = Object.fromEntries(PAGE_SLUGS.map((slug) => [slug, localized('page', slug)])) as Pages;

  // A project is listed only when chosen, public and published in English; Turkish lays its translated fields over
  // it. An unlisted project is in no list, featured or selected spot, search index or page.
  const cases: Record<string, Case> = {};
  const listed = rows.filter((r) => r.type === 'project' && r.locale === 'en' && r.listed === 1 && r.visibility === 'public').sort((a, b) => a.sort_rank! - b.sort_rank!);
  const projects = listed.map((r) => {
    const en = checked.get(r.rev) as Omit<Project, 'id'> & { case?: Case };
    const tr = locale === 'tr' ? (body('project', r.slug, 'tr') as Partial<typeof en> | undefined) : undefined;
    const { case: study, ...fields } = { ...en, ...tr };
    if (study) cases[r.slug] = study;
    return { id: r.slug, ...fields } as Project;
  });
  const ranked = (key: 'featured_rank' | 'selected_rank') =>
    listed.filter((r) => r[key] !== null).sort((a, b) => a[key]! - b[key]!).map((r) => projects.find((p) => p.id === r.slug)!);

  return { pages, projects, featured: ranked('featured_rank'), selected: ranked('selected_rank'), cases, cv: localized('cv', 'cv') as Cv };
}

/* ---------- writes ---------- */

export type Value = string | number | null;
export type Statement = { sql: string; args: Value[] };
export type EntryRef = { id: string; type: string; slug: string };

const now = () => new Date().toISOString();

/** Raising the generation makes every cached page unreachable at once, whatever happens to a purge. */
export const NEXT_GENERATION: Statement = { sql: "UPDATE meta SET value = CAST(value AS INTEGER) + 1 WHERE key = 'cache_generation'", args: [] };

/** Saves a new draft. The body is checked first; nothing is written if it doesn't fit its schema. */
export function saveDraft(entry: EntryRef, locale: Locale, body: unknown, author: string, note: string | null = null, id = crypto.randomUUID(), at = now()): Statement[] {
  schemaFor(entry.type, entry.slug, locale).parse(body);
  return [
    { sql: 'INSERT INTO revision (id, entry_id, locale, schema_version, body, note, author, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)', args: [id, entry.id, locale, SCHEMA_VERSION, JSON.stringify(body), note, author, at] },
    { sql: 'INSERT INTO entry_locale (entry_id, locale, draft_id) VALUES (?1, ?2, ?3) ON CONFLICT (entry_id, locale) DO UPDATE SET draft_id = excluded.draft_id', args: [entry.id, locale, id] },
  ];
}

/** Makes the current draft public. */
export const publishDraft = (entryId: string, locale: Locale, at = now()): Statement[] => [
  { sql: 'UPDATE entry_locale SET published_id = draft_id, published_at = ?3 WHERE entry_id = ?1 AND locale = ?2 AND draft_id IS NOT NULL', args: [entryId, locale, at] },
  NEXT_GENERATION,
];

/** Puts any earlier revision of the same entry and language back in front of the public. */
export const publishRevision = (entryId: string, locale: Locale, revisionId: string, at = now()): Statement[] => [
  { sql: 'UPDATE entry_locale SET published_id = ?3, published_at = ?4 WHERE entry_id = ?1 AND locale = ?2', args: [entryId, locale, revisionId, at] },
  NEXT_GENERATION,
];

/** Takes a language of an entry off the site. The cache generation goes first, so nothing cached survives it. */
export const unpublish = (entryId: string, locale: Locale): Statement[] => [
  NEXT_GENERATION,
  { sql: 'UPDATE entry_locale SET published_id = NULL, published_at = NULL WHERE entry_id = ?1 AND locale = ?2', args: [entryId, locale] },
];

/** Runs statements as one batch, which D1 applies all or nothing. */
export const run = (db: Db, statements: Statement[]) => db.batch(statements.map((s) => db.prepare(s.sql).bind(...s.args)));

const literal = (v: Value) => (v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${v.replaceAll("'", "''")}'`);
/** The same statements as a SQL file, for `wrangler d1 execute --file`. */
export const toSql = (statements: Statement[]) =>
  statements.map((s) => s.sql.replace(/\?(\d+)/g, (_, n: string) => literal(s.args[Number(n) - 1])) + ';').join('\n') + '\n';
