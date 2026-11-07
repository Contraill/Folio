# Roadmap

Folio was first built on a D1 content store (milestones 1 to 3, kept under the `archive/m3-d1` tag). It is now being moved to a static site with projects from GitHub, in eight stages. Each stage passes its own tests before the next starts; production (`main`, the coming-soon page) does not change until stage 6, and Cloudflare resources stay until stage 7.

## Done before the move

- **M1** Foundation and design system: Astro, React islands, the four skins, motion, notched panels, the shell, CSP.
- **M2** Every public page in English and Turkish, as approved in the prototype.
- **M3** A D1 content store with revisions. Replaced by Git content in stage 2; its tables and data stay in `folio-preview` until stage 7.

## Stage 0 — Preparation ✅

The develop head of M3 is tagged `archive/m3-d1`. A workflow in a separate private repository showed that the job's own `GITHUB_TOKEN` reads repositories, topics, homepages, social previews and pins through GraphQL, and that a private repository never appears in topic results, pins or logs. GitHub drops a repository from the pins when it goes private.

## Stage 1 — Static site and pipeline ✅ (on `develop`)

Static Astro build with a small language Worker; the D1 reads, server rendering and Workers Cache code removed. GitHub Actions for CI, Preview, production, the six-hour schedule and Refresh, with the production safeguards in [deployment.md](deployment.md).

Workers Builds is disconnected and the Actions environments hold their secrets; the first Preview run deployed. Still to do with the owner: correct the Access token values in the `preview` environment, protect `main`, and watch the pipeline tests run (concurrency, a deliberately broken build, CI minutes).

## Stage 2 — Content, themes, language, CV ✅

Page copy and projects in content collections, the four skins unchanged, the language Worker with unlisted rules, sitemap and search index, and `/cv` showing the owner's PDFs. Every route in both languages renders the same HTML as M3 apart from the decided changes (clean canonical without `hreflang`, the CV page, GitHub data).

## Stage 3 — GitHub projects ✅

Projects from the `folio` topic, featured from pins, Turkish and extras from `.github/folio.yaml`, social previews downloaded at build, projects not on GitHub, and the seven current projects kept until their repositories are tagged. See [content-model.md](content-model.md#projects).

## Stage 4 — Play, Lab and the app template

`folio-app-template` (with approval), `/play` and `/lab` catalogues with one page template, a pilot app connected end to end.

## Stage 5 — Private site

`folio-private` and a private Worker at `vault.oztozlu.dev` (with approval), with two templates: Cloudflare Access with Google sign-in and one-time PIN, per-person groups; and password pages encrypted at build and decrypted in the browser, with an Access bypass on their path only. Private assets reachable only by the allowed group.

## Stage 6 — Going live

Final checks on the Preview, the merge into `main` (with approval), checks in production.

## Stage 7 — Cleanup

At least a week after going live: export and delete `folio-preview`, remove unused Cloudflare settings (each with approval), record the monthly CI minutes.

## Before the repository goes public

The current Git history, the M3 code and seed content, tags and Actions logs are reviewed for anything secret; if needed, a clean public history is made. The current private history is never published. `folio-private` stays private.

## Risks

| Risk | Impact | Mitigation | Status |
| --- | --- | --- | --- |
| A merge to `main` replaces the coming-soon page | High | Branch protection with required checks; merging needs the owner's approval | Protection to be added in stage 1 |
| Workers Builds and Actions both deploy | Double or out-of-order deploys | Disconnect Workers Builds before the first Actions run | Done |
| GitHub delays or skips scheduled runs | Stale project data | `/_build.json` shows the data time; Refresh runs at once | In place |
| GitHub unreachable during a build | Failed run | The build fails and production keeps its last good version | In place |
| A repository goes private | Its data stays online until the next build | Removed at the next build (at most six hours, or Refresh); pins drop it immediately | In place |
| Previews are public by default | Unfinished work visible | Access on Previews, service token for tests, a test that requests without credentials are stopped | In place |
| CSP and client router are officially unsupported together | Hydration breaks after an upgrade | Regression tests fail on any violation | In place |
| No repository has the `folio` topic yet | Empty project list | The seven current projects are `listed` in Folio until the topics are added | In place |
| Search engines index only the English version | Turkish not found by name | Accepted: no prefix in addresses | Decision |
| JavaScript on every page, about 125 KB compressed | Slower start on weak devices | Engines are split per page already | Watch |
| WebKit untested locally | Safari or iOS regressions | Real-device pass before going live | Stage 6 |
| Prototype placeholders shown publicly | Unfinished content live | Launch checklist (see below) | Open |

## Launch content checklist

Provided by the site owner:

- [ ] About: personal sentence, portrait photo
- [ ] Case studies: "What I learned" for Helios, Mochi and huepr
- [ ] Now: this month's focus
- [ ] Uses: keyboard, monitor and other daily gear
- [ ] Confirm the `izzet@oztozlu.dev` mailbox works
- [ ] Review the Turkish interface strings in `src/i18n/messages.ts`
- [ ] Add the `folio` topic and social previews to the repositories to show
