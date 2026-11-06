# Architecture

Folio is the personal site at `oztozlu.dev`: an interactive portfolio built as static pages, with projects read from GitHub at build time. Design and behaviour come from an approved prototype. This document records how it is built and why.

Status markers: **built** exists on the development branch, **planned** comes in a later stage (see [roadmap.md](roadmap.md)).

## Overview

```text
 GitHub ── Folio repo (code, content, CV PDFs) ───────────┐
       └── public repos: topics, pins, folio.yaml ─────────┤ read at build, job token only
                                                           ▼
                                        GitHub Actions: checks → build → deploy
                                                           │
                                                           ▼
 oztozlu.dev ──► Cloudflare Worker `folio`
                  ├─ static files (/_astro, fonts, images, CV PDFs)  served directly
                  └─ language Worker (src/worker.ts): picks the English or Turkish
                     copy of a prebuilt page and sets the response headers
```

Stack: Astro 7 (static output), TypeScript, React 19 islands, Workers with Static Assets, GitHub Actions. No database, no server-side rendering, no admin: content is edited in Git.

## Rendering **(built)**

Every page is built ahead of time, twice: English at its address (`dist/about/index.html`) and Turkish under an internal prefix (`dist/__tr/about/index.html`). The language Worker is the only code that runs per request. Static files never reach it: `assets.run_worker_first` sends everything through the Worker except a short list of static prefixes, so `/about/index.html` and any spelling of `/__tr/...` still meet it.

`src/pages/[...locale]/*.astro` own routes and data; `getStaticPaths` builds each page for both languages, and `src/middleware.ts` reads the language from the prefix at build. Static markup stays in Astro components; anything interactive is a React island.

### Rules

- **Island props are public.** They are serialized into the HTML, so nothing private may be passed to an island.
- **Browser APIs stay behind a guard** in anything an island imports, since islands also render at build.
- **The route list is not public.** `scripts/postbuild.ts` writes it to `.folio/routes.json`, which the Worker bundles; no file in `dist` lists the routes (a test checks).

## Page transitions **(built)**

The approved design relies on a persistent shell: the top bar stays alive, its indicator slides between items, the page content transitions directionally, and card media morphs into the case-study panel.

| Option | Chromium 149 | Firefox 151 | Consequence |
| --- | --- | --- | --- |
| Astro `ClientRouter` (same-document transitions) | full | full | **Chosen.** Shell persists, identical behaviour in both engines |
| Native cross-document transitions (`@view-transition`) | full | fallback only (`pagereveal` is missing) | Firefox-based browsers would lose the approved transitions |

Measured in those browsers, not taken from compatibility tables. WebKit could not run on the development machine and remains to be tested on real devices.

How it fits together:

- `Base.astro` persists the top bar island and `#overlays`, the container Radix portals render into. Without that container, the body swap would remove portal content that React still owns.
- `src/lib/shell.ts` runs once and listens to the router's lifecycle: it computes the direction from menu order, carries the skin over to the incoming document and reinstalls the reveal and tilt layer.
- CSS in `motion.css` drives the animations through the `page`, `bar` and `media` transition names, as in the prototype.
- Project filters change the URL without a page transition. `ProjectsBrowser` handles their history entries ahead of the router, which would otherwise reload the page, and keeps the router's state on them so returning from another page works.
- Without JavaScript the site is a normal multi-page site.

Nothing on the page can be hit while a transition is on screen, because the animated elements are not hit-testable. So a press during a transition ends it at once, and the click is re-sent to whatever is under the pointer. Transitions also run about 0.7 seconds instead of 0.9: the same choreography with a shorter tail.

Links start loading on hover, focus or touch (Astro prefetch). For the browser to reuse what it prefetched, HTML is sent with `Cache-Control: private, max-age=60`: never kept by shared caches, and a published change reaches a visitor within a minute. Pages with private content must send `no-store` instead.

## Content Security Policy **(built)**

Astro writes the policy into each page as a meta tag: scripts are limited to `'self'` plus SHA-256 hashes, and styles allow `'unsafe-inline'` because components set CSS variables through style attributes. `frame-ancestors` can't be set from a meta tag, so the language Worker sends `frame-ancestors 'none'` as a header.

Astro's documentation lists `ClientRouter` as unsupported with `security.csp`. In testing the combination works in Chromium and Firefox, including across navigations. The end-to-end suite fails on any policy violation and asserts that an injected script is blocked.

## Design system **(built)**

| File | Contents |
| --- | --- |
| `styles/reset.css` | Base reset the design depends on |
| `styles/tokens.css` | The four skins as custom properties |
| `styles/site.css`, `motion.css`, `pages.css` | Prototype styles, unchanged |
| `styles/ui.css` | Overlay primitives (dialogs, sheets, popover, palette) |
| `styles/adaptations.css` | **Every intentional deviation from the prototype, in one place** |

Tailwind and the prototype's component scaffold are gone: Tailwind only served six overlay wrappers, which `ui.css` and direct Radix usage replace. Keeping the original stylesheets unchanged means any visual difference is explained by `adaptations.css`. All pages share one stylesheet, 18 KB compressed: splitting it would save little and its rules depend on their order.

Skins are applied before first paint by a small inline script (`lib/prepaint.ts`), allowed by its hash in the CSP.

## Internationalization **(built)**

No language prefixes in addresses. The language Worker resolves the language with `src/i18n/locale.ts`:

1. `?lang=tr` — explicit
2. `lang` cookie — the visitor's saved choice, written by the language buttons
3. `Accept-Language`
4. English

| Concern | Decision |
| --- | --- |
| Canonical URLs | One clean address per page, the same in both languages. Search engines index the English version; there are no `hreflang` alternates. A Turkish visitor following a search result still gets Turkish |
| Headers | Set by the Worker: `Content-Language`, `Vary: Cookie, Accept-Language`, `Cache-Control: private, max-age=60`, security headers, and `X-Robots-Tag: noindex` on unlisted pages |
| Internal prefix | Any direct request for `/__tr/...`, after decoding, collapsing slashes and ignoring case, gets the not-found page |
| Interface strings | `src/i18n/messages.ts`, shared by all components |
| Content | A Turkish file per page group in `src/content/pages`; when one is missing the English is used and the page says so |

## Content **(built)**

Content lives in the repository and is checked at build; an error in Folio's own files stops the build. See [content-model.md](content-model.md).

- Page copy: `src/content/pages/<group>/{en,tr}.md`
- Projects: GitHub repositories with the `folio` topic, merged with `src/content/projects/<id>/{en,tr}.md`
- CV: the owner's PDFs in `public/cv/{en,tr}.pdf`, served as they are

## Security model **(built unless noted)**

**Nothing to write to.** The site has no database, admin or write endpoint: changing it means a commit that passes the checks and a deploy.

**Private content is not in this site.** Public and unlisted pages are part of the public build; private pages will live in a separate repository and deployment behind Cloudflare Access (**planned**, stage 5), so they are physically absent from this build.

**Visibility levels:**

| Level | URL works | Navigation, search, sitemap | Indexing |
| --- | --- | --- | --- |
| `public` | yes | yes | yes |
| `unlisted` (`uses`, `now`, `secret`) | yes | no | `noindex` meta tag and `X-Robots-Tag` header |
| `private` | separate site, after sign-in | no | no |

**GitHub data** is read with the job's own `GITHUB_TOKEN`, which expires with the job and cannot see the owner's other private repositories. Private repositories are dropped before anything is written or logged, and again when projects are chosen; Folio's own repository is never a project.

**Previews** sit behind Cloudflare Access; production's `workers.dev` route is off, so production is reachable only through its domain.

**Secrets** are only in GitHub Actions: a Cloudflare API token limited to deploying this Worker, and the Access service token for testing Previews. None is in the repository or in a log.

## Resources and environments **(built)**

| | Local | Preview | Production |
| --- | --- | --- | --- |
| Worker | `pnpm preview` (`wrangler dev`) | Preview `develop` of `folio`, behind Access | `folio` on `oztozlu.dev` |
| Deployed by | — | GitHub Actions, on push to `develop` | GitHub Actions, on merge to `main`, every six hours and on Refresh |
| GitHub data | recorded snapshot in `tests/fixtures` | live | live |

The Preview still binds the old `folio-preview` D1 database, which nothing reads; it is removed in the cleanup stage. See [deployment.md](deployment.md).

## GitHub projects **(built)**

Projects are managed from GitHub; see [content-model.md](content-model.md#projects). Data is read at build, never while a visitor waits. A repository that goes private, or loses the `folio` topic, leaves the site at the next build; social previews are downloaded and optimised at build, so nothing points back at GitHub.

## Play and Lab **(planned, stage 4)**

Games and lab apps live in their own repositories and deployments, found by the `folio-play` and `folio-lab` topics. The build already sorts them out of the projects and counts them in `/_build.json`; their catalogues and pages come in stage 4.

