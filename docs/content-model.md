# Content

Everything the site says lives in Git or comes from GitHub, and is checked at build. There is no database or admin: a change is a commit to `develop`, checked on the Preview, then merged into `main`. The schemas are in `src/content/schema.ts`; the code that gathers content for a page is `src/content/load.ts`; the rules that pick projects are `src/content/discover.ts` (unit-tested).

## Pages

Each group of page copy is a pair of files, `src/content/pages/<group>/en.md` and `tr.md`, whose YAML frontmatter holds the text:

| Group | Used by |
| --- | --- |
| `shared` | Text of the live stages (Helios, huepr, Nothing KDE) and Mochi |
| `home`, `projects`, `case`, `lab`, `play`, `apps`, `about`, `privacy` | The pages of those names; `case` is the frame of every project page, `apps` of every game or lab app page |
| `now`, `secret` | Unlisted pages |

Both files are required: a missing `tr.md`, or one that doesn't fit its schema, stops the build. Both languages must have the same structure (a unit test compares them).

**Visibility** is a frontmatter field: `visibility: unlisted` keeps a page out of the menu, search, sitemap and search engines (`noindex` in the page and in the `X-Robots-Tag` header) while its address keeps working. Leaving it out means public. Private pages are not part of this site at all. Finding `/now` adds the Terminal skin to the skin menu in that browser, and `/secret` adds Blueprint; the skin in use doesn't change.

No placeholders: a unit test refuses copy with fill-in brackets or to-do notes. Text that would need regular upkeep (a monthly focus, a list of gear) is not on the site: `/now` is made from GitHub data and `/uses` no longer exists.

## Projects

Every **public** repository of the owner is a project, found by the GitHub step (`scripts/fetch-github.ts`) with no topic, flag or file in the repository. Never a private one, never Folio's own. A repository that is deleted or made private leaves at the next build (see *Keeping up with GitHub* in [architecture.md](architecture.md)).

| What | Where it comes from |
| --- | --- |
| Shown or not | Public on GitHub |
| Kind | The profile README (named after the owner), a template, a fork, a game or lab app in the controller's catalogue, or a project; shown on its page |
| Order on `/projects` | `order` in a Folio entry first, then the newest push; templates and the profile last |
| Home page | The profile pins, in pin order: the first three lead the hero, the next three are the selected work. Fewer pins, fewer cards; none are invented or repeated |
| Text | A Folio entry if there is one; otherwise the repository's description |
| Image | A Folio entry's images; otherwise the repository's own uploaded social preview; otherwise a typographic cover made from the repository's name and languages (GitHub's generated card is never used) |
| Link | The repository's homepage field, unless the entry has one |
| Stars, last push, languages, topics, current name | The repository, always |
| Address | The entry's folder name, or the repository's name in lower case. If two repositories would have the same address, the older keeps it and the newer gets `-2`, with a warning |

### Projects written in Folio

`src/content/projects/<id>/en.md` and `tr.md`, both required. `repoId` (the repository's numeric id) links an entry to its repository and survives renames; `repo` (the name) is the fallback. An entry without either is a project that isn't on GitHub.

- `en.md`: `name`, `repo`, `repoId`, `lang`, `date`, `since`, `stars`, `kind` (`img`, `browser`, `pixel`), `desc`, `topics`, `area` (`web`, `theming`, `self-hosted`, `hardware`, `desktop-apps`; `other` is for repositories Folio has nothing written about), optional `img`, `hero`, `pos`, `contain`, `home`, `tint`, `order` and `case` (the case study: lede, stack, facts and sections).
- `tr.md`: `desc` always, and `case` whenever English has one; `name` and `since` when they differ.

A repository without an entry still gets a complete page from GitHub alone: name, description, languages, topics, start date, last push, stars, links, and the sentence *A detailed project write-up is not available yet* / *Bu projenin detaylı anlatımı henüz hazırlanmadı.* On a Turkish page its English description is shown with a one-line note beside it. Adding an entry later needs no change in the repository itself.

### Showcases

Some projects have a design of their own, keyed by their id so that unpinning one keeps it for later: Helios's orrery, huepr's theme demo and Mochi's device on the hero stage, Nothing KDE's island and widgets (`NothingStage.tsx`), and the cards of Orbis, CampusEats and Breast Cancer Tracker in the selected work (`SelectedCard.astro`). A pinned project without one uses its image, or the typographic cover.

## /now

The latest commit on the default branch of each public repository (at most eight), newest first, with the repository, the commit's headline, its time and a link, and when the data was read from GitHub. It is read with the rest of the GitHub data, so private repositories never appear.

## Games and lab apps

Games and lab apps are repositories made from `folio-play-template` or `folio-lab-template`, published by the Folio controller and listed from its catalogue (`/catalog.json` on the controller's Worker). What a card shows (title and summary in both languages, order, whether Folio frames the app, its aspect and inputs) is in the `site.yaml` at the repository's root, documented in each template's README. The repository is a project too, whose page links to the app.

Each catalogue entry names its build by SHA-256; the build is downloaded at build time and kept only if it matches. An entry that doesn't fit the schema, or whose build doesn't match, is left out with a warning; if the catalogue can't be read, the build fails. Locally and in tests, `tests/fixtures/catalog.json` and `tests/fixtures/builds/` (two stand-in apps whose sources are in `tests/fixtures/apps/`) stand in for them.

## CV

`public/cv/en.pdf` and `public/cv/tr.pdf` are the owner's own PDFs, served exactly as committed at `/cv/en.pdf` and `/cv/tr.pdf`. The CV page draws them itself with pdf.js (text, links, zoom), and offers to open or download the file when that isn't possible. Updating the CV means replacing a file; nothing else changes. Browsers revalidate them on every visit (`Cache-Control: no-cache`), so a replaced file is never served stale. Only the public versions are ever committed.

## About and privacy

The About page's portrait is `public/assets/portrait.webp`, cropped and re-encoded from the owner's photo with its metadata removed. Its timeline and claims come from the repositories and the CV. The privacy page says what the site keeps in the browser, what Cloudflare logs, and how sign-in to separate sites works; update it when any of that changes (analytics, a new cookie, a new login method).
