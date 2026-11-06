# Content

Everything the site says lives in Git and is checked at build. There is no database or admin: a change is a commit to `develop`, checked on the Preview, then merged into `main`. The schemas are in `src/content/schema.ts`; the code that gathers content for a page is `src/content/load.ts`.

## Pages

Each group of page copy is a pair of files, `src/content/pages/<group>/en.md` and `tr.md`, whose YAML frontmatter holds the text:

| Group | Used by |
| --- | --- |
| `shared` | Text of the live stages and Mochi, and the "to write" marker |
| `home`, `projects`, `case`, `lab`, `play`, `about` | The pages of those names; `case` is the frame of every project page |
| `uses`, `now`, `secret` | Unlisted pages |

A file that doesn't fit its schema stops the build. A missing `tr.md` makes the Turkish page show the English text with a short note.

**Visibility** is a frontmatter field: `visibility: unlisted` keeps a page out of the menu, search, sitemap and search engines (`noindex` in the page and in the `X-Robots-Tag` header) while its address keeps working. Leaving it out means public. Private pages are not part of this site at all.

`now.updated` is the date `/now` shows; change it when the page is reviewed.

## Projects

Projects are managed from GitHub, read once per build by `scripts/fetch-github.ts` and chosen by `src/content/discover.ts`.

| What | Where it comes from |
| --- | --- |
| Shown or not | The repository's `folio` topic |
| Featured (at most six) and their order | Profile pins that also have the `folio` topic |
| Order of the rest | Newest push first; `order` in `.github/folio.yaml` puts a project ahead |
| English description | The repository description |
| Image | The repository's social preview, downloaded and optimised at build |
| Link | The repository's homepage field |
| Stars, last push, language | The repository, always |
| Turkish text and extras | Optional `.github/folio.yaml` in the repository; English is shown when it is missing |

Rules:

- Only public repositories count, and never Folio's own. A repository that goes private, is deleted or loses the topic leaves the site at the next build (at most six hours, or at once with Refresh), and its page answers 404.
- A `.github/folio.yaml` that doesn't fit the schema leaves out that one card and logs a warning; the build goes on. Errors in Folio's own files stop the build.
- If GitHub can't be reached the build fails, and production keeps its last good version.

`.github/folio.yaml`, every field optional:

```yaml
title: { tr: "Yılan" }           # English is the repository name
summary: { tr: "..." }           # English is the repository description
order: 3                         # earlier than projects without one
area: web                        # web, theming, self-hosted, hardware, desktop-apps
embed: true                      # Play and Lab apps: show in Folio, or false for a link only
embedOptions: { aspect: "16:9", orientation: landscape, input: [keyboard, touch] }
```

### Projects written in Folio

`src/content/projects/<id>/en.md` (and `tr.md`) holds a project's text, images, case study and area. `repo` links it to its GitHub repository; without one it is a project that isn't on GitHub, shown when `listed: true`.

When a repository has a Folio entry, the entry's text, images (or their absence, as for Mochi's live cover) and case study are used, and GitHub supplies stars, last push and language. The repository is shown once, whatever its topics.

**Until the repositories carry the `folio` topic**, the seven projects shown before this change have `listed: true`, which keeps them on the site while their repository is public. Their `featured` and `selected` ranks decide the home page until a pinned repository has the topic. Once the topics are in place, `listed` can be removed so that GitHub decides alone. The other public repositories have entries with `listed: false`: tagging one with `folio` shows it with the text and images written for it.

Games and lab apps carry `folio-play` or `folio-lab` instead; they are counted now and get their own pages in stage 4.

## CV

`public/cv/en.pdf` and `public/cv/tr.pdf` are the owner's own PDFs, served exactly as committed at `/cv/en.pdf` and `/cv/tr.pdf`. Updating the CV means replacing a file; nothing else changes. Browsers revalidate them on every visit (`Cache-Control: no-cache`), so a replaced file is never served stale. Only the public versions are ever committed.
