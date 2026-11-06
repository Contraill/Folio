# Content model

The content store, in use since milestone 3 for all page copy, the CV and every project, in English and Turkish. The tables are in `migrations/`, the schemas in `src/content/schema.ts`, reads and writes in `src/content/store.ts`. Parts marked **(planned)** come with later milestones.

## Guarantees

1. **Content is not in the build.** Code ships through Git, content lives in D1 and R2. A push, build or deploy has no path to content.
2. **Revisions are immutable.** Saving creates a new revision. Publishing moves a pointer, so rollback is one statement and nothing is ever lost by editing.
3. **Every write and every read is validated** against a versioned schema (zod). Old revisions stay readable through upgrade functions.
4. **Defaults never reach production silently.** Seeding is an explicit command that refuses to run on a non-empty database.
5. **GitHub data and manual data are stored apart**, so a sync cannot overwrite an edit.

## Why documents plus a little relational data

A fully relational schema would need a table per block type and a migration for each new field. Pure key-value storage would lose ordering, uniqueness and visibility queries. So anything queried or joined gets a column; anything rendered goes in a validated JSON body.

## Tables

In use, from `migrations/0001_content.sql`:

| Table | Holds |
| --- | --- |
| `entry` | Anything editable: id, type, slug, visibility (`public`, `unlisted`, `private`), deletion time |
| `revision` | Immutable history, one row per save: entry, language, schema version, JSON body, note, author. Triggers refuse any update or delete |
| `entry_locale` | Per entry and language, the draft being edited and the revision the public sees. Triggers refuse a pointer to another entry's or language's revision |
| `project` | What only projects have, the same in both languages: listed, order, featured and selected rank, and an optional GitHub repository id for the sync |
| `meta` | Store-wide state: the page cache switch, the cache generation, when the store was seeded |

Nothing in these tables comes from GitHub, and a project needs no repository: the write-up, links and images are manual content in its body.

**(planned)** Added with their milestones:

```sql
-- Milestone 5. Written only by the GitHub sync. Public repositories only.
CREATE TABLE github_repo (
  repo_id      INTEGER PRIMARY KEY,   -- stable across renames
  name         TEXT NOT NULL,
  html_url     TEXT NOT NULL,
  description  TEXT,
  homepage     TEXT,
  language     TEXT,
  stars        INTEGER NOT NULL DEFAULT 0,
  topics       TEXT NOT NULL DEFAULT '[]',
  created_at   TEXT,
  pushed_at    TEXT,
  last_seen_at TEXT NOT NULL,
  gone_at      TEXT                   -- no longer publicly visible
);

-- Milestone 6.
CREATE TABLE media (
  id             TEXT PRIMARY KEY,
  r2_key         TEXT NOT NULL UNIQUE,   -- content-addressed
  kind           TEXT NOT NULL CHECK (kind IN ('image', 'video', 'pdf')),
  mime           TEXT NOT NULL,
  width          INTEGER,
  height         INTEGER,
  bytes          INTEGER NOT NULL,
  alt            TEXT NOT NULL DEFAULT '{}',  -- per language
  source_repo_id INTEGER,                     -- removed when that repository goes private
  created_at     TEXT NOT NULL,
  deleted_at     TEXT
);

-- Milestone 4.
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY, at TEXT NOT NULL, actor TEXT NOT NULL,
  action TEXT NOT NULL, target TEXT, detail TEXT
);
```

## Entry types

| Type | Instances | Body holds |
| --- | --- | --- |
| `page` | One per group of page copy: `home`, `projects`, `case`, `lab`, `play`, `about`, `uses`, `now`, `secret`, and the copy shared by stages (`stage`, `mochi`, `toWrite`) | The copy, in a schema per group. `uses`, `now` and `secret` are `unlisted` |
| `cv` | one | The CV's text and project lines |
| `project` | many | English: every field the site shows, and the case study when there is one. Turkish: only the translated fields (`desc`, `since`, case study), laid over the English when read |
| `settings`, `navigation` **(planned)** | one | Milestone 4. Until then the contact address, GitHub link and project areas are in `src/content/site.ts`, and interface strings in `src/i18n/messages.ts` |
| `theme` **(planned)** | many | Milestone 8 |
| `experience` **(planned)** | many | Milestone 6: games, simulations and experiments from their own repositories, placed on Lab, Play, a case study or their own page, never required to be a project. The tables above take a new type without change |

Project ordering, publishing and featuring are columns on `project`, deliberately outside the per-language body: they are the same in both languages.

### Dates that describe content

Some pages show when their content was last reviewed, such as `/now`. That date is content, not a deploy or save timestamp: the body holds an optional `updated_on` the admin sets, and pages fall back to the revision's `published_at` when it is empty. Fixing a typo then doesn't make the page look freshly updated. Today the date is `updated` in the `now` page entry; the admin will edit it in milestone 4.

## Blocks

A body's `blocks` is an ordered list of a discriminated union, validated by zod:

```ts
type Block =
  | { type: 'richText'; markdown: string }           // restricted, no raw HTML
  | { type: 'gallery'; layout: 'collage' | 'strip'; items: { media: MediaId; caption?: string }[] }
  | { type: 'video'; media: MediaId; poster?: MediaId; loop?: boolean }
  | { type: 'diagram'; media: MediaId; caption?: string }
  | { type: 'facts'; items: { value: string; label: string }[] }
  | { type: 'featureGrid'; title: string; items: { title: string; text: string }[] }
  | { type: 'masterDetail'; title: string; items: { title: string; text: string }[] }
  | { type: 'links'; items: { label: string; url: string }[] }
  | { type: 'embed'; url: string; aspect: string }   // sandboxed, origin allowlist
  | { type: 'experience'; engine: EngineId; config: unknown }; // config validated per engine
```

Every prototype case-study section maps to one of these, so existing write-ups migrate without losing their layout. Live Site and Source Code are fields on `project`, not blocks, and are independent of everything above.

## Lifecycle

```text
save draft ──► new revision, entry_locale.draft_id moves
preview    ──► render draft_id on the admin host, never cached (planned, milestone 4)
publish    ──► published_id = draft_id, cache generation + 1
rollback   ──► published_id = any earlier revision of the same entry and language, cache generation + 1
unpublish  ──► cache generation + 1 first, then published_id = NULL
```

A write is a batch, which D1 applies all or nothing. The body is checked against its schema before the batch is built, so nothing invalid is ever written. Raising the cache generation makes every cached page unreachable at once (see "Edge caching" in [architecture.md](architecture.md)); a purge by tag can be added when publishing moves into the admin.

Each language publishes independently. On public reads, Turkish falls back to English when it has no published revision.

## Reading

Every public page loads its content through `loadContent`, the one function public routes have. It reads published revisions only, of entries that are neither private nor deleted, in the asked language with English as the fallback:

```text
project is listed when: listed = 1
                    and entry.visibility = 'public' and not deleted
                    and the English version is published
                    and (repo_id is null or github_repo.gone_at is null)   ← milestone 5
```

A request makes one small query for the list of published revisions. Bodies are fetched only for revisions the Worker hasn't seen yet, checked against their schema, and kept, which is safe because a revision never changes; which revisions a request may see is always decided by the query, never by what is kept.

A repository found by the sync becomes a candidate and stays unlisted until chosen, so publishing is never automatic. The seed lists the seven featured and selected projects; the other public repositories are stored as candidates, with no page.

Merged fields resolve as `override ?? github`. Clearing an override makes GitHub's value live again.

## Themes

Tokens are typed, so they cannot carry CSS or script:

| Token group | Validation |
| --- | --- |
| Colours (`page`, `slab`, `ink`, `accent`, …) | `#rrggbb` only; WCAG contrast checked when saving |
| Radii and gap | Number within a fixed range |
| Fonts | Chosen from the self-hosted set |
| Image filter | Chosen from the named filters in code |

The four built-in skins stay in code as permanent defaults, so a bad edit can always be reverted. Custom presets are generated on the server into `html[data-skin='…'] { --page: #…; }`. The footer wordmark ratio (`--wm-k`) is computed from the chosen font on save.

## Media

Uploads go through a privileged API that checks type by content and enforces size limits. Keys are content-addressed in R2. Public delivery goes through a Worker route, so removing an asset takes effect immediately rather than leaving a directly reachable object. SVG uploads are not accepted, because SVG can carry script.

Replacing a CV PDF creates a new asset and moves the reference in the `cv` entry, so `/cv.pdf` stays stable and older versions stay in history.

## Migrations

- Forward-only numbered SQL files in `migrations/`, applied as a separate, explicit step before a deploy, naming their database: `pnpm db:migrate:local` (a file under `.wrangler/`) or `pnpm db:migrate:preview` (`folio-preview`). No build or deploy runs them, and there is no production command until the cutover.
- A migration is all or nothing: one that fails half-way leaves no table, row or record behind. `node scripts/verify-store.ts <local|preview> failed-migration` checks this against the real database.
- **Expand, then contract:** each migration stays compatible with the previous code version, so a failed deploy can roll back without touching data. Columns are removed one release after nothing reads them.
- Body changes do not need SQL: `schema_version` selects an upgrade function at read time.
- Always applied to preview first, against a recent copy of production data.

## Seeding

`pnpm db:seed:local` or `pnpm db:seed:preview` loads `seed/` into an empty store: every page, the CV and all fourteen projects, each published in English and Turkish. The tool refuses a store that has any content, and the SQL it runs starts by recording the seed, so even run by hand a second time it fails before writing anything (`node scripts/verify-store.ts <target> repeat-seed`). The site never reads `seed/`; a test checks that the build contains none of its text.

## Export and backup

| Layer | What | Where |
| --- | --- | --- |
| D1 Time Travel | Point-in-time restore | Cloudflare (retention depends on the plan) |
| Scheduled export | Full JSON of all tables, daily | Private R2 prefix |
| On-demand export | JSON plus a media manifest | Admin download |

Restore is tested against preview. Private content is included in exports, so exports are never public and must never be committed.

## Migrating the prototype's data

| Prototype | In the store |
| --- | --- |
| `PROJECTS`, `CASES` | `project` entries, the case study in the body; `project` rows. `github_repo` joins in milestone 5 |
| `PUBLISHED`, `FEATURED`, `SELECTED` | `listed`, `sort_rank`, `featured_rank`, `selected_rank` on `project` |
| Page copy, `PATH`, patterns, `USES`, Now | `page` entries; `uses`, `now` and `secret` unlisted |
| CV `T` and `P` | `cv` entry (EN and TR) |
| `SKINS` | Built-in skins in code |
| `MENU`, contact address, areas | Code until the `navigation` and `settings` entries (milestone 4) |
