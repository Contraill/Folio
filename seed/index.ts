/* The first content of an empty store: every page, the CV and all projects, each published in English and
   Turkish. The first statement records the seed, so running it a second time fails before writing anything. */
import { PAGE_SLUGS, UNLISTED_PAGES } from '../src/content/schema.ts';
import { publishDraft, saveDraft, type Statement } from '../src/content/store.ts';
import type { Locale } from '../src/i18n/locale.ts';
import { casesFor } from './cases.ts';
import { CV_PROJECTS, CV_TEXT } from './cv.ts';
import { pages } from './pages.ts';
import { FEATURED, PROJECTS, PUBLISHED, SELECTED, TR } from './projects.ts';

const rank = (list: string[], id: string) => (list.includes(id) ? list.indexOf(id) : null);

export function seedStatements(at = new Date().toISOString()): Statement[] {
  const out: Statement[] = [{ sql: "INSERT INTO meta (key, value) VALUES ('seeded_at', ?1)", args: [at] }];
  const add = (type: string, slug: string, visibility: 'public' | 'unlisted', bodies: Record<Locale, unknown>) => {
    const id = `${type}:${slug}`;
    out.push({ sql: 'INSERT INTO entry (id, type, slug, visibility, created_at) VALUES (?1, ?2, ?3, ?4, ?5)', args: [id, type, slug, visibility, at] });
    for (const locale of ['en', 'tr'] as const) {
      out.push(...saveDraft({ id, type, slug }, locale, bodies[locale], 'seed', 'First version', undefined, at));
      out.push(publishDraft(id, locale, at)[0]); // the generation is raised once, at the end
    }
    return id;
  };

  for (const slug of PAGE_SLUGS) add('page', slug, UNLISTED_PAGES.includes(slug) ? 'unlisted' : 'public', { en: pages.en[slug], tr: pages.tr[slug] });

  add('cv', 'cv', 'public', { en: { text: CV_TEXT.en, projects: CV_PROJECTS.en }, tr: { text: CV_TEXT.tr, projects: CV_PROJECTS.tr } });

  PROJECTS.forEach(({ id, ...fields }, i) => {
    const entry = add('project', id, 'public', {
      en: { ...fields, case: casesFor('en')[id] },
      tr: { ...TR[id], case: casesFor('tr')[id] },
    });
    out.push({
      sql: 'INSERT INTO project (id, entry_id, listed, sort_rank, featured_rank, selected_rank) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
      args: [id, entry, PUBLISHED.includes(id) ? 1 : 0, PUBLISHED.includes(id) ? PUBLISHED.indexOf(id) : PUBLISHED.length + i, rank(FEATURED, id), rank(SELECTED, id)],
    });
  });

  out.push({ sql: "UPDATE meta SET value = CAST(value AS INTEGER) + 1 WHERE key = 'cache_generation'", args: [] });
  return out;
}
