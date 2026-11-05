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

`wrangler.jsonc` holds the Preview settings in its `previews` block. It is empty today because the application has no storage bindings. Previews do not inherit production settings, so when D1 or R2 arrive, each binding is repeated there and pointed at a Preview-only resource.

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

### Access and security

Preview URLs are **public by default**, and each Preview keeps up to 100 Unique Deployment URLs, so anything pushed to a branch stays reachable. Cloudflare adds `X-Robots-Tag: noindex` on `workers.dev` Preview hostnames. Never push secrets or private content to any branch.

To restrict them: Workers & Pages → `folio` → Access → Protect this Worker behind Access → **Previews only**, then choose a policy. Production stays unprotected, as it is today. This is required before a Preview holds any non-public content, so at the latest before milestone 3.

With Static Assets, Cloudflare does not pass `ctx.access` to the Worker, so application code must verify the `Cf-Access-Jwt-Assertion` header itself.

### Checking a build

- Dashboard: Workers & Pages → `folio` → Deployment → View Build History. Logs are kept for 90 days.
- GitHub: `gh api repos/Contraill/Folio/commits/<sha>/check-runs --jq '.check_runs[] | "\(.name) \(.conclusion)"'`

## Local development

Requires Node 22.23.4 or newer, and pnpm.

```sh
pnpm install
pnpm dev                       # development server, in the Workers runtime
pnpm build && pnpm preview     # production build, in the Workers runtime
pnpm exec astro preview stop   # preview runs in the background
```

`pnpm dev` also runs in the background; stop it with `pnpm exec astro dev stop`.

## Checks

```sh
pnpm check       # types and Astro diagnostics
pnpm test        # unit tests
pnpm test:e2e    # end-to-end against a running preview, Chromium and Firefox
```

First run of the end-to-end tests needs `pnpm exec playwright install chromium firefox`.

CSP is only active in `build` + `preview`, not in `dev`, so end-to-end tests run against the preview.

Avoid running `wrangler deploy` from this repository: the configured Worker is the production one.

## Cutover

Every step needs explicit approval at the time. Nothing here is automated.

1. All milestones approved on a tested Preview.
2. Production D1 and R2 created, migrations applied, content seeded and reviewed.
3. Access policies for the admin host and private pages created and tested with a denied identity.
4. Secrets set on the production Worker.
5. Build command set to `pnpm build` and the Node version pinned. From this point a build of the old `main` would fail, so this step comes right before the merge.
6. Merge to `main`; the build deploys.
7. Verify production: public pages, admin denied when signed out, private page 404 when signed out, headers.

**Rollback:** restore the previous version from Workers → `folio` → Deployments. Content in D1 and R2 is not affected by a code rollback.
