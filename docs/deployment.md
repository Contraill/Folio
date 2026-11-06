# Deployment

## Branches

| Branch | Workers Builds runs | Result |
| --- | --- | --- |
| `main` | Build command (empty), then `npx wrangler deploy` | **Production**: `oztozlu.dev`, currently the coming-soon page |
| Any other, such as `develop` | Build command (empty), then the Preview command | A **Preview** on the same `folio` Worker, with its own URL |

The coming-soon page is also kept unchanged in `archive/coming-soon/` on the development branch.

**Merging to `main` is the release.** No technical safeguard stops it. An earlier version of this project named the Worker `folio-dev` on the assumption that a mismatch would fail the build. That was wrong: Workers Builds sets `WRANGLER_CI_OVERRIDE_NAME` to the connected Worker, and Wrangler overrides the configured name with a warning. Releases are controlled by process: nothing merges to `main` without explicit approval.

## Preview setup

The Preview command builds the site first, because the Build command is shared with production and has to stay empty while `main` holds the coming-soon page, which has no `package.json`.

`wrangler.jsonc` holds the Preview settings in its `previews` block, which is the only place with a database: `DB` bound to `folio-preview` (D1, EEUR), plus `PAGE_CACHE: allowed` and Workers Cache enabled. Previews do not inherit production settings, and production has no storage binding at all until the cutover. `src/content/config.test.ts` checks this on every test run.

The Preview database is prepared by hand, never by a build: `pnpm db:migrate:preview` applies migrations to `folio-preview` by name, and `pnpm db:seed:preview` fills it once, refusing if it has any content. Both use `wrangler.preview-migrations.jsonc`, which names no Worker code and so cannot be deployed.

Dashboard settings, under Workers & Pages → `folio`:

| Setting | Value | Affects |
| --- | --- | --- |
| Settings → Build → Preview command | `pnpm run preview:cloudflare` | Previews only |
| Settings → Build → Branch control → Enable Preview Builds | On | Previews only |
| Settings → Build → Branch control → Production branch | `main`, unchanged | Do not change |
| Settings → Build → Build command | Empty, unchanged | Shared with production; do not change |
| Settings → Build → Deploy command | `npx wrangler deploy`, unchanged | Production; do not change |
| Settings → Domains & Routes → Version URLs (formerly Preview URLs) | Enabled | Worker-level; does not change `oztozlu.dev` |

The `preview_urls` value in `wrangler.jsonc` is applied only by `wrangler deploy`, not by `wrangler preview`, so until the cutover this setting is managed in the dashboard.

A Preview's URL is `<branch>-folio.<subdomain>.workers.dev`. It is shown in the build log and in the GitHub check.

### Observability

Previews log every request and trace it (`previews.observability` in `wrangler.jsonc`); query strings are removed from both. Look under Workers & Pages → `folio` → Observability, choosing the Preview, for:

- **Logs:** each request with its status, plus anything the code logs.
- **Traces:** where time goes within a request.
- **Issues:** errors grouped as they happen.
- **Metrics:** requests, errors, CPU time and duration, always on and needing no setting.

Production gets the same, with tracing added, only at the cutover, because that configuration is applied by `wrangler deploy`.

Not enabled, each needing a decision or affecting production:

- **Web Analytics (real visitors' Core Web Vitals):** a zone setting for `oztozlu.dev`, so it would also inject a script into the coming-soon page. Turn it on at the cutover; the CSP then has to allow `https://static.cloudflareinsights.com` for scripts and `https://cloudflareinsights.com` for connections.
- **Notifications:** for example, an alert on a raised Worker error rate. These are account settings in Notifications.

### Access and security

Preview URLs are **public by default**, and each Preview keeps up to 100 Unique Deployment URLs, so anything pushed to a branch stays reachable. Cloudflare adds `X-Robots-Tag: noindex` on `workers.dev` Preview hostnames. Never push secrets or private content to any branch.

They are restricted: Workers & Pages → `folio` → Access → Protect this Worker behind Access → **Previews only**, with a policy for the owner and a Service Auth policy for automated tests. Production stays unprotected, as it is today.

With Static Assets, Cloudflare does not pass `ctx.access` to the Worker, so application code must verify the `Cf-Access-Jwt-Assertion` header itself.

### Checking a build

- Dashboard: Workers & Pages → `folio` → Deployment → View Build History. Logs are kept for 90 days.
- GitHub: `gh api repos/Contraill/Folio/commits/<sha>/check-runs --jq '.check_runs[] | "\(.name) \(.conclusion)"'`

## Local development

Requires Node 22.23.4 or newer, and pnpm. Local runs use the `local` environment of `wrangler.jsonc` (`CLOUDFLARE_ENV=local`), whose database is a SQLite file under `.wrangler/`.

```sh
pnpm install
pnpm db:migrate:local && pnpm db:seed:local   # once: the local content store
pnpm dev                                      # development server, in the Workers runtime
pnpm build:local && pnpm preview              # production build, in the Workers runtime
pnpm exec astro preview stop                  # preview runs in the background
```

`pnpm build` without `:local` is the one Previews use; its output has no local database.

`pnpm dev` also runs in the background; stop it with `pnpm exec astro dev stop`.

## Checks

```sh
pnpm check       # types (generated by wrangler types) and Astro diagnostics
pnpm test        # unit tests, including the store against Node's SQLite and the configuration
pnpm test:e2e    # end-to-end against a running preview, Chromium and Firefox
```

Against real databases, each leaving the content as it found it:

```sh
node scripts/verify-store.ts preview repeat-seed        # the seed SQL run again by hand writes nothing
node scripts/verify-store.ts preview failed-migration   # a migration failing half-way leaves no trace
node scripts/verify-store.ts preview probe              # before a deploy; compare with `fingerprint` after it
node scripts/verify-page-cache.ts https://develop-folio.<subdomain>.workers.dev   # needs the Access token; ends switched off
```

First run of the end-to-end tests needs `pnpm exec playwright install chromium firefox`.

CSP is only active in `build` + `preview`, not in `dev`, so end-to-end tests run against the preview.

Against a deployed Preview, which sits behind Access, export the Access service token as `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`, then run `BASE_URL=https://develop-folio.<subdomain>.workers.dev pnpm test:e2e`. The token's headers are added only to requests for that host, and API requests don't follow redirects, so the token cannot reach another host. `tests/e2e/access.spec.ts` checks that requests with no credentials or a made-up token are stopped by Access on pages, data, fonts and icons alike. Never put the token in the repository, in logs or in reports.

Avoid running `wrangler deploy` from this repository: the configured Worker is the production one.

## Cutover

Every step needs explicit approval at the time. Nothing here is automated.

1. All milestones approved on a tested Preview.
2. Production D1 created and bound at the top level of `wrangler.jsonc`, a migrations config for it added, migrations applied, content seeded and reviewed. R2 when milestone 6 needs it.
3. Access policies for the admin host and private pages created and tested with a denied identity.
4. Secrets set on the production Worker.
5. Build command set to `pnpm build` and the Node version pinned. From this point a build of the old `main` would fail, so this step comes right before the merge.
6. Merge to `main`; the build deploys.
7. Verify production: public pages, admin denied when signed out, private page 404 when signed out, headers, and a fingerprint of the database before and after the deploy.
8. Only then, and only with approval, allow the page cache in production (`PAGE_CACHE`, `cache.enabled`) and run `scripts/verify-page-cache.ts` against it before switching it on.

**Rollback:** restore the previous version from Workers → `folio` → Deployments. Content in D1 and R2 is not affected by a code rollback.
