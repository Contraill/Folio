# Deployment

All builds and deploys run in GitHub Actions (`.github/workflows/`). Code reaches `main` only through a pull request whose checks passed; scheduled builds rebuild the approved code on `main` with fresh GitHub data.

| Trigger | Workflow | What happens |
| --- | --- | --- |
| Push to `develop` | Preview | Checks, build, unit tests and checks on the build output, Preview deploy (`wrangler preview --name develop`), the smoke tests against the Preview with the Access service token |
| Run workflow on Preview, with *full* | Preview | The same, with the whole browser suite against the Preview |
| A sync, started by the Folio controller (`sync: true`) | Preview | Every six hours, when its catalogue changes, and at once when a repository is created, deleted, made private or public, renamed, archived or transferred. It reads GitHub first and compares the data's hash and the commit with the live `/_build.json`: nothing new, nothing built. Otherwise the same as a push |
| Pull request into `main` | CI | Checks, build, unit tests and checks on the build output, the whole browser suite in Chromium and Firefox. Required for merging |
| Merge into `main` | Production | Build and `wrangler deploy` |
| Every six hours (`17 */6 * * *`) | Production | The same, on `main` as it is, but only if the GitHub data or the catalogue changed. GitHub may delay or skip scheduled runs: six hours is a target, not a promise |
| A sync, started by the Folio controller (`sync: true`) | Production | From go-live, once the controller's `FOLIO_TARGETS` includes `production.yml@main`: as on the Preview |
| Refresh (Run workflow on Production) | Production | The same, queued at once; can be started from the GitHub mobile app |

Scheduled workflows run only on the default branch (`main`), so the Preview's six-hourly sync comes from the controller instead of a schedule of its own.

## Production safeguards

- **One deploy at a time.** Merge, schedule and Refresh share the `production` concurrency group without cancelling a running job; a waiting older run is dropped when a newer one arrives.
- **No stale build.** A run builds `main` as it is when the run starts, not the commit that queued it, and compares that commit with `main` again just before deploying. If `main` moved, it stops without deploying; the newer run deploys.
- **A failed build changes nothing.** If the checks, the build or GitHub fail, the job fails before deploying and the live version stays. GitHub e-mails the person who last changed the schedule when a scheduled run fails.
- **`/_build.json`** names the live build: commit, build time, trigger (`push`, `cron`, `manual`), when its GitHub data was read, and how many projects, games and lab apps it shows. After each deploy the job reads it from `oztozlu.dev` and fails unless it names this build. It holds no route list.

## Secrets

Kept as **environment** secrets, never repository secrets, so each workflow reaches only its own. Neither is in the code or in a log.

| Environment (branches allowed) | Secrets | Used by |
| --- | --- | --- |
| `preview` (`develop`) | `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit, D1: Read for the Preview's leftover binding), `CLOUDFLARE_ACCOUNT_ID`, `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` | Preview |
| `production` (`main`) | `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit), `CLOUDFLARE_ACCOUNT_ID` | Production |

The environments are created by hand with their branch rule before the first run, so GitHub never creates an open one. To set or replace the Access token's secrets from the file that holds it, without the values appearing anywhere:

```sh
( set -a; . <token file>; set +a
  printf %s "$CF_ACCESS_CLIENT_ID"     | gh secret set CF_ACCESS_CLIENT_ID     --env preview
  printf %s "$CF_ACCESS_CLIENT_SECRET" | gh secret set CF_ACCESS_CLIENT_SECRET --env preview )
``` GitHub data needs no stored token: each job's own `GITHUB_TOKEN` reads it and expires with the job. The Preview is made with `wrangler preview --name develop`, which uses the `previews` settings and bindings; `wrangler versions upload --preview-alias` would run on production's.

## Preview

A push to `develop` updates the Preview at `https://develop-folio.<subdomain>.workers.dev`, behind Cloudflare Access (Previews only). Version URLs stay behind Access too. Workers Builds must be disconnected from the `folio` Worker before the first Actions deploy, so that a push doesn't deploy twice.

## Emergency removal

A project: make its repository private, or delete it. The controller starts a sync at once; the project is gone once that build is deployed (a few minutes, depending on the Actions queue). Check `/_build.json`, or run Refresh if a sync didn't start. A game or lab app: archive or delete its repository, or remove its `site.yaml`; the controller drops it from the catalogue and starts Folio's build. A separate site: the same; the controller takes its address down within about a minute. Rolling back to an earlier Worker version is not a removal: the project is still in it. For Google's index, use Search Console → Removals.

There is no instant block in the Worker: removal takes one build. That is the accepted cost of keeping the Worker free of per-request lookups.

## Local development

Requires Node 26 (`.node-version`, also used by every workflow; 22.23.4 is the oldest that works) and pnpm 12 (`packageManager` in `package.json`).

```sh
pnpm install
pnpm dev          # development server; pages under their address, Turkish ones under /__tr
pnpm build        # GitHub snapshot, static build, route list and /_build.json
pnpm preview      # the build behind the language Worker, at http://localhost:4321
```

Without `GITHUB_TOKEN` the build uses the recorded snapshot in `tests/fixtures/github.json`, the recorded catalogue in `tests/fixtures/catalog.json` and the two stand-in app builds in `tests/fixtures/builds/`; in CI a missing token stops the build. `FOLIO_GITHUB=fixture` forces all three. With a token, games and lab apps come from the controller's catalogue (`FOLIO_CATALOG_URL` overrides its address), and their builds from the same Worker, by hash.

## Checks

```sh
pnpm check        # types (generated by wrangler types) and Astro diagnostics; needs no build
pnpm test         # unit tests; after a build they also check its output
pnpm test:e2e     # browser suite against `wrangler dev` (started if needed)
pnpm test:smoke   # only the tests tagged @smoke
pnpm test:visual  # the core pages compared with screens recorded earlier on this machine
```

| Browser tests | What they cover | Engines |
| --- | --- | --- |
| `http.spec.ts` | What the Worker answers: languages, the internal prefix, unlisted pages, 404, sitemap and search, security and cache headers, the CV files, `/_build.json`, Access refusing strangers | Once (no browser involved) |
| `shell.spec.ts` | Navigation, transitions, skins, overlays, language switching, CSP enforcement, the CV page | Chromium and Firefox |
| `pages.spec.ts` | Every page at desktop and phone widths, with and without JavaScript, and each page's own interactions | Chromium and Firefox |

`@smoke` marks the critical path run after every push; `@once` marks tests whose subject doesn't depend on the browser engine (HTTP, app logic), run in Chromium only. Layout, motion, focus, the router and the PDF viewer differ between engines and run in both. The full run on the Preview (*Run workflow* with *full*) also runs the critical path in WebKit, Safari's engine (`FOLIO_WEBKIT=1`); WebKit can't run on every machine, so it isn't part of local runs, and a real iPhone or Mac is still the only check of Safari itself.

Against the Preview, which sits behind Access: export `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`, then run `BASE_URL=https://develop-folio.<subdomain>.workers.dev pnpm test:smoke` (or `test:e2e`). A preflight first proves that the token reaches Folio itself, and with `FOLIO_EXPECTED_SHA` that the Preview serves that commit; if not, nothing runs and one error says why, describing the token's shape but never its value. The token's headers are added only to that host; traces are off while it is in use, and request errors are scrubbed of it, so neither the output nor the report holds it. Three workers keep the remote run steady.

A failed run in Actions keeps its HTML report (screenshots and errors) as an artifact for 14 days.

**Screens.** `pnpm test:visual --update-snapshots` records the core pages, at desktop and phone width, from the build being served; `pnpm test:visual` then compares a later build with them. Record on the commit before a change, with the recorded GitHub snapshot (a local build). Rendering differs between machines, so the screens stay local (`tests/e2e/__screenshots__`, ignored by Git) and CI doesn't run them.

## Tooling

- **Workflows** run on `ubuntu-24.04`, not `ubuntu-latest`, which GitHub is moving to 26.04: the image changes only on purpose, with a test run. Every action is pinned to a commit, with its version alongside.
- **Dependencies** install with `--frozen-lockfile` under pnpm 12's supply-chain checks. Only `esbuild` and `workerd` may run install scripts (`allowBuilds` in `pnpm-workspace.yaml`).
- **TypeScript** stays on 6.x: `astro check` doesn't support TypeScript 7 yet.
- **`patches/@astrojs__react.patch`**: when a visitor leaves a page before React has taken over its components (a slow phone, a quick click), Astro unmounts them mid-hydration and React reports error 424, although nothing is wrong. The patch treats only that case, a component no longer in the page, as expected; every other error is reported as before. A browser test reproduces it on a throttled CPU. Remove the patch once `@astrojs/react` handles this itself; pnpm stops if it no longer applies.

## Going live

Every step needs explicit approval at the time.

1. All stages approved on the Preview.
2. Branch protection on `main`: the CI check required, force-push and deletion off. (Not set yet: until it is, nothing technical stops a direct push to `main`.)
3. Decide on Cloudflare Web Analytics for the zone: it injects a beacon script into every page, which the Content Security Policy blocks (console errors, no data). Either turn automatic injection off for `oztozlu.dev` (no analytics, as the privacy page says now), or allow its origin in the policy on purpose and update the privacy page.
4. Merge `develop` into `main`; the Production workflow deploys and the schedule starts.
5. In the controller, set `FOLIO_TARGETS` to `preview.yml@develop,production.yml@main` (repository variable and `wrangler.jsonc`, then deploy its Worker), so syncs and app changes reach production too.
6. Check production: `/_build.json`, both languages, unlisted pages, the CV, `/play` and `/lab`, and `status.oztozlu.dev`.
7. Optionally publish the Google sign-in app (it needs `https://oztozlu.dev/privacy` live; see the site template's README).

**Rollback:** Workers → `folio` → Deployments → an earlier version. The coming-soon page is the version live today.
