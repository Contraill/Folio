# Architecture

Folio is the personal site at `oztozlu.dev`: a highly interactive portfolio on top of a real application with persistent, admin-managed content. Design and behaviour come from an approved prototype. This document records how the application underneath is built and why.

Status markers: **built** exists on the development branch, **planned** is a design that later milestones implement (see [roadmap.md](roadmap.md)).

## Overview

```text
                        ┌──────────────────────────────────────────────┐
 oztozlu.dev  ─────────►│ Cloudflare Worker                            │
                        │  ├─ static assets  /_astro, /fonts  (no JS)  │
 admin.oztozlu.dev ────►│  ├─ middleware: locale, headers, host gate   │
   (behind Access)      │  ├─ public pages (Astro SSR + React islands) │
                        │  ├─ admin pages and privileged API           │
                        │  └─ scheduled: GitHub sync, backups          │
                        └───────┬─────────────┬───────────────┬────────┘
                                │             │               │
                              D1 content    R2 media      GitHub API
                              (structured)  (uploads,     (public repos
                                            backups)       only)
```

Stack: Astro 7, TypeScript, React 19 islands, `@astrojs/cloudflare`, Workers with Static Assets, D1, R2, Cloudflare Access.

## Rendering **(built)**

Every HTML page is rendered on demand by the Worker. Hashed assets and fonts are served directly from Static Assets and never run Worker code.

Pre-rendering was rejected because one URL serves two languages through negotiation, published content changes without a deploy, and private pages need a server decision on each request. Rendering costs little: measured on the Preview, HTML pages answer as fast as static files. Edge caching (below) is still planned for the content store.

`src/pages/*.astro` own routes and data. Static markup stays in Astro components; anything interactive is a React island. The footer, for example, is plain Astro with a small delegated script, while the top bar is an island.

### Rules for server code

- **Module scope is shared between requests** in a Worker isolate. Request data never goes into module-level variables; `src/lib/store.ts` only mutates state in the browser and everything per-request travels through props or `Astro.locals`.
- **Island props are public.** They are serialized into the HTML, so nothing private or admin-only may be passed to a public island.
- **Browser APIs stay behind a guard** in anything an island imports, since islands also render on the server.

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

Astro sends the policy as a response header: scripts are limited to `'self'` plus SHA-256 hashes, `frame-ancestors 'none'` blocks framing, and styles allow `'unsafe-inline'` because components set CSS variables through style attributes.

Astro's documentation lists `ClientRouter` as unsupported with `security.csp`. In testing the combination works in Chromium and Firefox, including across navigations, because the hash list covers every page. The end-to-end suite fails on any policy violation and asserts that an injected script is blocked, so a future regression is caught. If it does regress, the fallback is a hand-maintained header with the same hashes.

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

## Internationalization **(built: plumbing and shell; planned: content)**

No language prefixes. `src/i18n/locale.ts` resolves the language in this order:

1. `?lang=tr` — explicit, used for sharing and crawling
2. `lang` cookie — the visitor's saved choice
3. `Accept-Language`
4. English

| Concern | Decision |
| --- | --- |
| Canonical URLs | `/about` is English, `/about?lang=tr` is Turkish. Each page declares itself canonical and lists `hreflang` alternates plus `x-default`. Crawlers send no language preference and would otherwise never see Turkish |
| Sharing | The `?lang=tr` URL renders Turkish metadata, including `og:locale`, for link previews |
| Caching | Responses carry `Vary: Cookie, Accept-Language` and `Content-Language`. The planned edge cache keys on the resolved language |
| Interface strings | `src/i18n/messages.ts`, shared by all components. No duplicated component trees |
| Content | Per-language revisions in the content store. A missing Turkish translation falls back to English, and the fallback block is marked `lang="en"` for assistive technology |

## Content **(planned)**

Editable content lives in D1 and R2, entirely separate from code. A build contains no content, so a deploy cannot overwrite it. See [content-model.md](content-model.md).

## Edge caching **(planned)**

Public HTML goes through the Workers Cache API, keyed by URL and resolved language, with a short lifetime and stale-while-revalidate. Publishing is therefore visible within about a minute without extra infrastructure. Private pages and admin routes are never cached, and removals (a repository going private, a page being unpublished) also purge explicitly. Purge semantics across data centres must be verified in milestone 3 before relying on them.

## Security model **(planned unless noted)**

**Admin.** `admin.oztozlu.dev` is one Astro application with the public site, gated by host in middleware. A separate Worker was considered: it isolates better, but the admin must render drafts through the same page components, and a monorepo costs more than it returns for one person.

**Authorization is enforced in code, on every privileged route.** Cloudflare Access is the first layer; the application then verifies the `Cf-Access-Jwt-Assertion` token itself (signature against the team's JWKS, `aud`, `iss`, expiry) and checks the email against an allowlist. `ctx.access` is not an option here, because Cloudflare does not pass it to a Worker that uses Static Assets. Hiding the interface is never the control. Local development uses a development-only identity that is compiled out of production builds.

**No bypass routes.** Production's `workers.dev` route is off (**built**), so production is reachable only through its custom domain. Previews have public `workers.dev` hostnames by default, so they must sit behind Access before holding anything non-public, and the application's own token check applies on every host.

**Private pages** render on the server after the same verification. An anonymous request gets the same 404 as a page that does not exist, so existence is not revealed. They are excluded from the cache, the sitemap, search and every public API, and their content never appears in the repository or in static assets. They live under `/private/*` so that an Access policy can cover the path.

**Visibility levels:**

| Level | URL works | Navigation, search, sitemap | Indexing | Auth |
| --- | --- | --- | --- | --- |
| `public` | yes | yes | yes | none |
| `unlisted` | yes | no | `noindex` | none |
| `private` | after sign-in | no | `noindex` | server-side |

**Secrets** live in Wrangler secrets and local `.dev.vars` (ignored by Git). The only GitHub credential is a token limited to public, read-only access, so private repository data cannot be fetched even by mistake.

**Theme customization** stores typed design tokens validated against an allowlist, and the server generates the CSS from them. Admins cannot supply raw CSS or JavaScript.

## Resources and environments **(planned; nothing is created yet)**

| | Local | Preview | Production |
| --- | --- | --- | --- |
| Worker | `astro dev`, `astro preview` | Preview of `folio`, one per branch | `folio` |
| D1 | local file | `folio-preview` | `folio-production` |
| R2 | local | `folio-preview-media` | `folio-media` |
| Access | development identity | test policy | production policy |

Previews do not inherit production settings: bindings are declared separately in the `previews` block of `wrangler.jsonc`, which is empty today because nothing is bound. Environments never share data. Creating any of these requires explicit approval. See [deployment.md](deployment.md).

## GitHub integration **(planned)**

A scheduled job fills a `github_repo` cache table. Repositories are discovered by a configurable topic, and manual additions are allowed. Synchronization writes only to that table; admin edits live elsewhere and overlay it at read time, so a sync cannot overwrite them by construction.

Listing uses the public API, which by definition returns only public repositories. A repository that is no longer returned is treated as gone: it leaves public pages immediately, its detail page returns 404, media copied from it is removed, and cached pages are purged. Hiding a project in Folio is a separate flag and leaves GitHub untouched.

## Project experiences **(planned)**

Project pages are ordered lists of typed blocks: rich text, gallery, video, diagram, facts, embed and interactive experience. Live Site and Source Code are independent fields, so a project may have any combination or none of these.

An experience block names an engine from a registry in code (`orrery`, `theme-demo`, `mochi`, …) plus configuration validated by that engine's schema. The admin selects, configures and orders existing blocks; a new engine is a code change. Admin-authored code never runs. Embeds use a sandboxed iframe limited to an allowlist of origins, which the CSP `frame-src` mirrors.
