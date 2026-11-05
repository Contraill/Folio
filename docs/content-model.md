# Content model

Proposal for the persistent content store, implemented from milestone 3. Nothing here exists yet; the site currently reads seed files in `src/content/`, in English and Turkish.

## Guarantees

1. **Content is not in the build.** Code ships through Git, content lives in D1 and R2. A push, build or deploy has no path to content.
2. **Revisions are immutable.** Saving creates a new revision. Publishing moves a pointer, so rollback is one statement and nothing is ever lost by editing.
3. **Every write and every read is validated** against a versioned schema (zod). Old revisions stay readable through upgrade functions.
4. **Defaults never reach production silently.** Seeding is an explicit command that refuses to run on a non-empty database.
5. **GitHub data and manual data are stored apart**, so a sync cannot overwrite an edit.

## Why documents plus a little relational data

A fully relational schema would need a table per block type and a migration for each new field. Pure key-value storage would lose ordering, uniqueness and visibility queries. So anything queried or joined gets a column; anything rendered goes in a validated JSON body.

## Tables

```sql
-- Anything editable: pages, home, about, cv, nav, footer, settings, themes, project write-ups.
CREATE TABLE entry (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  slug        TEXT,
  visibility  TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  created_at  TEXT NOT NULL,
  deleted_at  TEXT,
  UNIQUE (type, slug)
);

-- Immutable history, one row per save.
CREATE TABLE revision (
  id             TEXT PRIMARY KEY,
  entry_id       TEXT NOT NULL REFERENCES entry(id),
  locale         TEXT NOT NULL CHECK (locale IN ('en', 'tr')),
  schema_version INTEGER NOT NULL,
  body           TEXT NOT NULL CHECK (json_valid(body)),
  note           TEXT,
  author         TEXT NOT NULL,
  created_at     TEXT NOT NULL
);

-- Where each language of an entry currently stands.
CREATE TABLE entry_locale (
  entry_id     TEXT NOT NULL REFERENCES entry(id),
  locale       TEXT NOT NULL CHECK (locale IN ('en', 'tr')),
  draft_id     TEXT REFERENCES revision(id),
  published_id TEXT REFERENCES revision(id),
  published_at TEXT,
  PRIMARY KEY (entry_id, locale)
);

-- Written only by the GitHub sync. Public repositories only.
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

-- Written only by the admin. Overlays github_repo at read time.
CREATE TABLE project (
  id            TEXT PRIMARY KEY,
  entry_id      TEXT NOT NULL UNIQUE REFERENCES entry(id),  -- localized write-up and blocks
  repo_id       INTEGER REFERENCES github_repo(repo_id),    -- null for projects without a repository
  area          TEXT,
  listed        INTEGER NOT NULL DEFAULT 0,   -- nothing is public until chosen; leaves GitHub untouched
  featured_rank INTEGER,                      -- null means not featured
  sort_rank     INTEGER NOT NULL DEFAULT 0,
  live_url      TEXT,
  source_url    TEXT
);

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

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY, at TEXT NOT NULL, actor TEXT NOT NULL,
  action TEXT NOT NULL, target TEXT, detail TEXT
);
```

## Entry types

| Type | Instances | Body holds |
| --- | --- | --- |
| `settings` | one | Default skin, default language, contact email, GitHub topic, social links |
| `navigation` | one | Menu items and order, footer text and link columns |
| `home` | one | Hero text, hero source and picks, ordered configurable sections |
| `about` | one | Intro, photo, skills, patterns, timeline, call to action |
| `cv` | one | Structured CV, and the media id of an uploaded PDF per language |
| `page` | many | Title, description, blocks |
| `project` | many | Lede, stack, facts, blocks; any field may override GitHub's value |
| `theme` | many | Name, token values |

Project ordering and featuring are columns on `project`, deliberately outside the per-language body: the order is the same in both languages.

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
preview    ──► render draft_id on the admin host, never cached
publish    ──► published_id = draft_id, purge cached pages
rollback   ──► published_id = any earlier revision
```

Each language publishes independently. On public reads, Turkish falls back to English when it has no published revision.

## Reading

Public reads use `published_id` only, and every query filters on visibility:

```text
project is listed when: listed = 1
                    and entry.visibility = 'public'
                    and entry has a published revision
                    and (repo_id is null or github_repo.gone_at is null)
```

The filter lives in one function, and public routes have no other way to reach project data.

A repository found by the sync becomes a candidate and stays unpublished until it is listed, so publishing is never automatic. Until the store exists, `LISTED`, `FEATURED` and `SELECTED` in `src/content/projects.ts` hold these choices, and every public route goes through the same filter.

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

- Forward-only numbered SQL files in `migrations/`, applied by `wrangler d1 migrations apply` as a separate, explicit step before a deploy.
- **Expand, then contract:** each migration stays compatible with the previous code version, so a failed deploy can roll back without touching data. Columns are removed one release after nothing reads them.
- Body changes do not need SQL: `schema_version` selects an upgrade function at read time.
- Always applied to preview first, against a recent copy of production data.

## Export and backup

| Layer | What | Where |
| --- | --- | --- |
| D1 Time Travel | Point-in-time restore | Cloudflare (retention depends on the plan) |
| Scheduled export | Full JSON of all tables, daily | Private R2 prefix |
| On-demand export | JSON plus a media manifest | Admin download |

Restore is tested against preview. Private content is included in exports, so exports are never public and must never be committed.

## Migrating the prototype's data

| Prototype | Target |
| --- | --- |
| `PROJECTS` | `project` plus `github_repo`, joined by repository name |
| `CASES` | `project` entries with blocks |
| `FEATURED`, `SELECTED` | `featured_rank` and the `home` entry |
| `PATH`, patterns | `about` entry |
| CV `T` and `P` | `cv` entry (EN and TR) |
| `USES`, Now text | `page` entries, `unlisted` |
| `SKINS` | Built-in skins in code |
| `MENU` | `navigation` entry |
