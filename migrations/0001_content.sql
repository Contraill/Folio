-- Content store, see docs/content-model.md. Applied with `pnpm db:migrate:local` or `pnpm db:migrate:preview`,
-- never by a build or a deploy.

-- Anything editable: page copy, the CV, projects.
CREATE TABLE entry (
  id         TEXT PRIMARY KEY,
  type       TEXT NOT NULL,
  slug       TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  created_at TEXT NOT NULL,
  deleted_at TEXT,
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
CREATE INDEX revision_by_entry ON revision (entry_id, locale, created_at);
CREATE TRIGGER revision_no_update BEFORE UPDATE ON revision BEGIN SELECT RAISE(ABORT, 'revisions are immutable'); END;
CREATE TRIGGER revision_no_delete BEFORE DELETE ON revision BEGIN SELECT RAISE(ABORT, 'revisions are immutable'); END;

-- Where each language of an entry stands: the draft being edited and the revision the public sees.
CREATE TABLE entry_locale (
  entry_id     TEXT NOT NULL REFERENCES entry(id),
  locale       TEXT NOT NULL CHECK (locale IN ('en', 'tr')),
  draft_id     TEXT REFERENCES revision(id),
  published_id TEXT REFERENCES revision(id),
  published_at TEXT,
  PRIMARY KEY (entry_id, locale)
);
-- A pointer may only name a revision of the same entry and language.
CREATE TRIGGER entry_locale_insert_check BEFORE INSERT ON entry_locale
WHEN (NEW.draft_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM revision WHERE id = NEW.draft_id AND entry_id = NEW.entry_id AND locale = NEW.locale))
  OR (NEW.published_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM revision WHERE id = NEW.published_id AND entry_id = NEW.entry_id AND locale = NEW.locale))
BEGIN SELECT RAISE(ABORT, 'revision belongs to another entry or language'); END;
CREATE TRIGGER entry_locale_update_check BEFORE UPDATE ON entry_locale
WHEN (NEW.draft_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM revision WHERE id = NEW.draft_id AND entry_id = NEW.entry_id AND locale = NEW.locale))
  OR (NEW.published_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM revision WHERE id = NEW.published_id AND entry_id = NEW.entry_id AND locale = NEW.locale))
BEGIN SELECT RAISE(ABORT, 'revision belongs to another entry or language'); END;

-- What only projects have, the same in both languages. Nothing here comes from GitHub: repo_id is filled
-- by the sync in milestone 5, and a project without a repository is just as valid.
CREATE TABLE project (
  id            TEXT PRIMARY KEY,                           -- the address, /projects/<id>
  entry_id      TEXT NOT NULL UNIQUE REFERENCES entry(id),
  repo_id       INTEGER,
  listed        INTEGER NOT NULL DEFAULT 0 CHECK (listed IN (0, 1)),  -- nothing is public until chosen
  sort_rank     INTEGER NOT NULL DEFAULT 0,
  featured_rank INTEGER,                                    -- home hero, null when not featured
  selected_rank INTEGER                                     -- home "Selected work", null when not selected
);

-- Store-wide state. page_cache is the runtime switch for the shared page cache; cache_generation is part of
-- every cache key, so raising it makes every cached page unreachable at once.
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO meta (key, value) VALUES ('page_cache', 'off'), ('cache_generation', '1');
