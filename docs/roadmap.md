# Roadmap

Each milestone is small enough to review on its own and ends with tests, a comparison against the prototype in real browsers, and a report of what is done and what is not. No milestone deploys to production; only the cutover does, and only with explicit approval.

## M1 — Foundation and shared design system ✅

Astro on the Workers runtime, TypeScript, React islands. Design tokens, skins, fonts, motion system and notched panels. Shell: top bar, footer, search, skin menu, contact sheet, mobile menu. Client router with persistent shell and directional transitions. Language negotiation with EN and TR interface strings. CSP and security headers. CV page as the first real consumer. Unit and end-to-end tests.


## M2 — Public pages ✅

All public pages migrated, in English and Turkish, from seed content: Home with its live stages, Projects, case studies, Lab, Play, About, CV, Uses, Now, Secret and the 404. Lab and Play stay Work in Progress.

Resolved here:

- Mobile compositions, About first, plus the CV toolbar, Lab and Play controls
- Hero: every stage is live, the orrery explains itself and works from the keyboard, the wallpaper picker is no longer cut off on phones, using a stage holds the slideshow
- Skin corners in Terminal and Blueprint, and the clipped Back to Top pill and teaser arrows
- Copy no longer describes a device or an input method (enforced by a test)
- Publishing is explicit: the seed publishes the seven featured and selected projects, the other repositories stay candidates
- `/secret` stays an easter egg, out of search, sitemap and navigation

Decided against splitting the stylesheet per page: it is 18 KB compressed for the whole site, and its rules depend on their order.

## M3 — Content store

**Needs approval to create preview resources, and Access on Previews first.** D1 schema, migrations, zod schemas, the read layer behind today's seed imports, seed tool, local and preview environments, edge caching with verified purge behaviour.

**Exit:** the site renders identically from D1, and a test proves a deploy leaves content untouched.

## M4 — Admin foundation

**Needs approval for Access configuration.** `admin.oztozlu.dev` host gate, JWT verification with tests for missing, expired, wrong-audience and wrong-email tokens. Editors for settings, navigation, footer, home and about. Drafts, preview, publish, history, rollback, export.

**Exit:** routine text changes need no code and survive a deploy.

## M5 — Projects and GitHub

Sync job, repository cache, discovery topic, manual additions, overrides, hide/show, featured selection and ordering. Privacy sweep when a repository disappears, covering pages, caches and media.

**Exit:** a test repository going private disappears from every public surface.

## M6 — Project experiences and media

R2 uploads, media library, block editor, gallery/video/diagram/embed blocks, experience registry with per-engine configuration, uploadable CV PDFs.

## M7 — Pages and privacy

Admin-created pages with the three visibility levels. Private page route and Access policy. Sitemap, robots, search index. Tests that private content never appears in anonymous HTML, JavaScript, assets or API responses.

## M8 — Turkish content and themes

Translation status in the admin, final review of Turkish copy. Theme preset editor with typed tokens and contrast checks.

## M9 — Hardening and cutover

Security review and threat model, dependency audit, performance and accessibility audit, real-device tests on iOS and Android, WebKit coverage. Fill all content placeholders. Then the cutover in [deployment.md](deployment.md), with approval.

## M10 — Open-source readiness

Licence choice, audit of files and full Git history, contribution docs. The repository owner changes the visibility; no automated step does.

## Risks

| Risk | Impact | Mitigation | Status |
| --- | --- | --- | --- |
| A merge to `main` replaces the live coming-soon page | High | No technical guard exists. Merge only with explicit approval; add a branch rule on `main` if the plan allows | **Process only** |
| The empty Build command doesn't suit Astro in production | Launch failure | Previews build through their own command; set the Build command right before the cutover merge | Planned M9 |
| Previews are public by default | Unfinished work visible, later data exposure | No bindings or private data today; Access set to Previews only before M3 | **Decision** |
| Same URL serves two languages | Mixed cache variants, Turkish unindexed | `Vary`, cache keyed on language, `?lang=tr` canonical with `hreflang` | Headers in place; cache M3 |
| CSP and client router are officially unsupported together | Hydration breaks after an upgrade | Regression tests fail on any violation; documented fallback | In place |
| Request data leaking through module scope in Workers | Cross-visitor data exposure | Store is browser-only; rule documented | In place; review in M4 |
| Deploy overwrites content | Data loss | No content in builds; seed refuses non-empty databases | Design |
| Migration incompatible with running code | Downtime | Expand and contract; preview first | Design |
| Private content leaks | High | Server-only, no cache, same 404 as missing, tests on every public surface | Design |
| Access bypassed through other hostnames | High | Production `workers.dev` route off, JWT verified in application code on every host | Partly in place |
| A repository goes private and stays cached | Private metadata exposed | Treat absence as removal, purge pages and media | Design |
| No repository has the discovery topic yet | Empty sync | Tag repositories or seed from the current list | Decision |
| JavaScript on every page, about 125 KB compressed, mostly the framework and overlay library | Slower start on weak devices | Engines are split per page already; lazy-loading overlays is the next step if field data asks for it | Watch |
| WebKit untested locally | Safari or iOS regressions | Real-device pass before launch | Planned M9 |
| Prototype placeholders shown publicly | Unfinished content live | Launch checklist (see below) | Open |

## Launch content checklist

Provided by the site owner:

- [ ] About: personal sentence, portrait photo
- [ ] CV: internship dates and description, English level
- [ ] Case studies: "What I learned" for Helios, Mochi and huepr
- [ ] Now: this month's focus
- [ ] Uses: keyboard, monitor and other daily gear
- [ ] Confirm the `izzet@oztozlu.dev` mailbox works
- [ ] Review the Turkish interface strings in `src/i18n/messages.ts`
