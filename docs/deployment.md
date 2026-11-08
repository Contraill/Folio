# Deployment

Every build and deploy runs in GitHub Actions (`.github/workflows/`). Code reaches `main` only through a pull request whose checks pass, and merging into `main` is the release. How the pieces fit together is in [architecture.md](architecture.md).

## Workflows

| Trigger | Workflow | What happens |
| --- | --- | --- |
| Push to `develop` | Preview | Type check, build, unit tests and checks on the build output, deploy the Preview (`wrangler preview --name develop`), then the smoke tests against it through Access |
| *Run workflow* on Preview, with *full* | Preview | The same, with the whole browser suite against the Preview, and its critical path in WebKit too |
| A sync from the Folio controller (`sync: true`) | Preview | Every six hours, when the controller's catalogue changes, and at once when a public repository is created, deleted, renamed, archived or transferred, or a repository is made private or public. It reads GitHub first and compares a hash of the data, and the commit, with the live `/_build.json`: if nothing is new, nothing is built. Otherwise the same as a push |
| Pull request into `main` | CI | Type check, build, unit tests and checks on the build output, the whole browser suite in Chromium and Firefox. Its `checks` job is required for merging |
| Merge into `main` | Production | Build and `wrangler deploy`, then a check that production serves this build |
| Every six hours (`17 */6 * * *`) | Production | The same, on `main` as it is, but only if the GitHub data or the catalogue changed. GitHub may delay or skip scheduled runs |
| A sync from the Folio controller | Production | As on the Preview, once the controller's `FOLIO_TARGETS` includes `production.yml@main` |
| Refresh (*Run workflow* on Production) | Production | Always builds and deploys; it can be started from the GitHub mobile app |

Scheduled workflows run only on the default branch, so the Preview's regular sync comes from the controller instead of a schedule of its own. A push replaces a Preview run in progress; a sync waits for it. Production has both: the controller's syncs, and its own schedule in case the controller can't start it.

## Production safeguards

- **One deploy at a time.** Merges, the schedule, syncs and Refresh share the `production` concurrency group without cancelling a running job; a waiting older run is dropped when a newer one arrives.
- **No stale build.** A run builds `main` as it is when the run starts, not the commit that queued it, and compares that commit with `main` again just before deploying. If `main` moved, it stops without deploying, and the newer run deploys.
- **A failed build changes nothing.** If the checks, the build or GitHub fail, the job stops before deploying and the live version stays. GitHub emails the person who last changed the schedule when a scheduled run fails.
- **`/_build.json`** names the live build: commit, build time, trigger (`push`, `cron`, `manual`), when its GitHub data was read, a hash of that data, and how many projects, games and lab apps it shows. After each deploy the job reads it from `oztozlu.dev` and fails unless it names this build (`scripts/check-live.ts`).

## Secrets

Kept as **environment** secrets, never repository secrets, so each workflow reaches only its own. None is in the code or in a log.

| Environment (branch allowed) | Secrets | Used by |
| --- | --- | --- |
| `preview` (`develop` only) | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `FOLIO_CATALOG_TOKEN`, `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` | Preview |
| `production` (`main` only) | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `FOLIO_CATALOG_TOKEN` | Production |

The Cloudflare tokens can deploy Workers (*Workers Scripts: Edit*); `FOLIO_CATALOG_TOKEN` reads the controller's catalog of games and lab apps. CI has no secrets: a pull request from a fork runs with a read-only token and never reaches an environment.

GitHub data needs no stored token: each job's own `GITHUB_TOKEN` reads it and expires with the job. Every workflow sets `permissions: contents: read`.

To set or replace the Access service token's secrets from the file that holds it, without the values appearing anywhere:

```sh
( set -a; . <token file>; set +a
  printf %s "$CF_ACCESS_CLIENT_ID"     | gh secret set CF_ACCESS_CLIENT_ID     --env preview
  printf %s "$CF_ACCESS_CLIENT_SECRET" | gh secret set CF_ACCESS_CLIENT_SECRET --env preview )
```

## Preview

A push to `develop` updates the Preview at `https://develop-folio.<subdomain>.workers.dev`, behind Cloudflare Access; version URLs stay behind Access too. It is made with `wrangler preview --name develop`, which uses the `previews` settings and bindings in `wrangler.jsonc`, never production's. Workers Builds stays disconnected from the `folio` Worker, so a push never deploys twice.

## Removing something quickly

- **A project:** make its repository private, or delete it. The controller starts a sync at once, and the project is gone when that build is deployed (a few minutes, depending on the Actions queue). Check `/_build.json`, or run Refresh if no sync started.
- **A game or lab app:** archive or delete its repository, or remove its `site.yaml`. The controller drops it from the catalogue and starts Folio's build.
- **A separate site:** the same; the controller takes its address down within about a minute.

Rolling back to an earlier Worker version is not a removal: the project is still in it. For search results, use Google Search Console → Removals.

## Local development

Requires Node 26 (`.node-version`, also used by every workflow) and pnpm 12 (`packageManager` in `package.json`).

```sh
pnpm install
pnpm dev          # development server; pages at their address, Turkish ones under /__tr
pnpm build        # GitHub data, static build, route list and /_build.json
pnpm preview      # the build behind the language Worker, at http://localhost:4321
```

Without `GITHUB_TOKEN` the build uses the recorded snapshot in `tests/fixtures/github.json`, the recorded catalogue in `tests/fixtures/catalog.json` and the two stand-in app builds in `tests/fixtures/builds/` (their sources are in `tests/fixtures/apps/`); in CI a missing token stops the build. `FOLIO_GITHUB=fixture` forces all three. With a token, games and lab apps come from the controller's catalogue (`FOLIO_CATALOG_URL` overrides its address), and their builds from the same Worker, by hash.

## Checks

```sh
pnpm check        # types (generated by wrangler types) and Astro diagnostics; needs no build
pnpm test         # unit tests; after a build they also check its output
pnpm test:e2e     # browser suite against the local build (pnpm preview), in Chromium and Firefox
pnpm test:smoke   # only the tests tagged @smoke
pnpm test:visual  # the core pages compared with screens recorded earlier on this machine
```

| Browser tests | What they cover | Engines |
| --- | --- | --- |
| `http.spec.ts` | What the Worker answers: languages, the internal prefix, unlisted pages, 404, sitemap and search, security and cache headers, the CV files, `/_build.json`, Access refusing strangers | Once (no browser involved) |
| `shell.spec.ts` | Navigation, transitions, skins, overlays, language switching, CSP enforcement, the CV page | Chromium and Firefox |
| `pages.spec.ts` | Every page at desktop and phone widths, with and without JavaScript, each page's own interactions, and games and lab apps: their frame, policy, storage and routing | Chromium and Firefox |

`@smoke` marks the critical path, run after every push. `@once` marks tests whose subject doesn't depend on the browser engine (HTTP, app logic), run in Chromium only. Layout, motion, focus, the router and the PDF viewer differ between engines and run in both. The full run on the Preview also runs the critical path in WebKit, Safari's engine (`FOLIO_WEBKIT=1`); WebKit can't run on every machine, so it isn't part of local runs, and a real iPhone or Mac is still the only check of Safari itself.

Against the Preview, which sits behind Access: export `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`, then run `BASE_URL=https://develop-folio.<subdomain>.workers.dev pnpm test:smoke` (or `test:e2e`). A preflight first proves that the token reaches Folio itself, and with `FOLIO_EXPECTED_SHA` that the Preview serves that commit; if not, nothing runs and one error says why, describing the token's shape but never its value. The token's headers are added only for that host; traces are off while it is in use, and request errors are scrubbed of it, so neither the output nor the report holds it. Three workers keep the remote run steady.

A failed run in Actions keeps its HTML report (screenshots and errors) as an artifact for 14 days.

**Screens.** `pnpm test:visual --update-snapshots` records the core pages, at desktop and phone width, from the build being served; `pnpm test:visual` then compares a later build with them. Record on the commit before a change, with the recorded GitHub snapshot. Rendering differs between machines, so the screens stay local (`tests/e2e/__screenshots__`, ignored by Git) and CI doesn't run them.

## Tooling

- **Workflows** run on `ubuntu-24.04`, not `ubuntu-latest`, so the image changes only on purpose, with a test run. Every action is pinned to a commit, with its version alongside, and the repository requires it.
- **Dependencies** install with `--frozen-lockfile` under pnpm 12's supply-chain checks. Only `esbuild` and `workerd` may run install scripts (`allowBuilds` in `pnpm-workspace.yaml`). Dependabot alerts are on.
- **TypeScript** stays on 6.x until `astro check` supports 7.
- **`patches/@astrojs__react.patch`**: when a visitor leaves a page before React has taken over its components (a slow phone, a quick click), Astro unmounts them mid-hydration and React reports error 424, although nothing is wrong. The patch treats only that case, a component no longer in the page, as expected; every other error is reported as before. A browser test reproduces it on a throttled CPU. Remove the patch once `@astrojs/react` handles this itself; pnpm stops if it no longer applies.

## Releasing

`scripts/release-check.sh` reads the state of every gate below and changes nothing, so it can be run at any point, as often as needed. Each step that changes something needs the owner's explicit approval at the time, and is done by the owner.

**Before merging**

1. The Preview is green on the commit to release (a full run: *Run workflow* on Preview with *full*), and it has been checked by hand in both languages and the four skins.
2. Protect `main`: the CI `checks` job required, branches up to date, force pushes and deletion off.

   ```sh
   gh api -X PUT repos/Contraill/Folio/branches/main/protection --input - <<'JSON'
   { "required_status_checks": { "strict": true, "contexts": ["checks"] },
     "enforce_admins": true, "required_pull_request_reviews": null, "restrictions": null,
     "allow_force_pushes": false, "allow_deletions": false }
   JSON
   ```

3. The `production` environment allows `main` only, and `preview` allows `develop` only.
4. Workers Builds is disconnected from the `folio` Worker (Cloudflare dashboard → Workers → `folio` → Settings → Build).
5. Cloudflare Web Analytics stays off for `oztozlu.dev`: it would inject a beacon that the Content Security Policy blocks, and the privacy page says there are no analytics.

**Merging**

6. Open a pull request from `develop` into `main`, wait for CI, and merge it. The Production workflow builds and deploys `main`, then checks that `oztozlu.dev/_build.json` names that build.

**After the first deploy**

7. Check production by hand: `/_build.json`, both languages, unlisted pages (`noindex`), the CV, `/play` and `/lab`, `www.oztozlu.dev` redirecting to `oztozlu.dev`.
8. Let the controller start production too: set `FOLIO_TARGETS` to `preview.yml@develop,production.yml@main` in the controller's repository variable and its `wrangler.jsonc`, then deploy its Worker.

**Going public**

9. Make the repository public, then turn on private vulnerability reporting and require approval for workflow runs from outside contributors:

   ```sh
   gh repo edit Contraill/Folio --visibility public --accept-visibility-change-consequences
   gh api -X PUT repos/Contraill/Folio/private-vulnerability-reporting
   gh api -X PUT repos/Contraill/Folio/actions/permissions/fork-pr-contributor-approval -f approval_policy=all_external_contributors
   ```

10. Run `scripts/release-check.sh` again: branch protection, environments and Actions settings must still hold after the change.

**Rolling back.** Cloudflare dashboard → Workers → `folio` → Deployments → an earlier version, or `pnpm exec wrangler rollback` with the owner's login. A rollback lasts until the next deploy: revert the change on `main` too, or the next schedule or sync deploys it again.
