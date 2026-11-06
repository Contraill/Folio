/* A summary of everything a store holds, to compare across a deploy. It covers every content table and column,
   and leaves out only runtime state that tests and the cache change on purpose. */
import { createHash } from 'node:crypto';

export type Query = <T = Record<string, unknown>>(sql: string) => T[];

/* The page cache switch, the cache generation and the deploy probe change without any content changing. */
export const RUNTIME_META = ['page_cache', 'cache_generation', 'deploy_probe'];

export function fingerprint(query: Query) {
  const tables = {
    entry: query('SELECT id, type, slug, visibility, created_at, deleted_at FROM entry ORDER BY id'),
    revision: query('SELECT id, entry_id, locale, schema_version, body, note, author, created_at FROM revision ORDER BY id'),
    entry_locale: query('SELECT entry_id, locale, draft_id, published_id, published_at FROM entry_locale ORDER BY entry_id, locale'),
    project: query('SELECT id, entry_id, repo_id, listed, sort_rank, featured_rank, selected_rank FROM project ORDER BY id'),
    meta: query(`SELECT key, value FROM meta WHERE key NOT IN (${RUNTIME_META.map((k) => `'${k}'`).join(', ')}) ORDER BY key`),
  };
  const probe = query<{ value: string }>("SELECT value FROM meta WHERE key = 'deploy_probe'")[0]?.value ?? null;
  return {
    entries: tables.entry.length,
    revisions: tables.revision.length,
    projects: tables.project.length,
    probe,
    hash: createHash('sha256').update(JSON.stringify(tables)).digest('hex').slice(0, 16),
  };
}
