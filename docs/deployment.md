# Deployment

## Current state

`oztozlu.dev` serves the coming-soon page from the `main` branch. Cloudflare Workers Builds is connected to this repository, and **every push to `main` deploys to production** through `npx wrangler deploy`.

The replacement is developed on `develop` and stays local until a preview environment is approved. The coming-soon page is preserved unchanged in `archive/coming-soon/`, and `main` still contains it in its original location.

## Safeguards

- `wrangler.jsonc` on this branch names the Worker `folio-dev`, while production is `folio`. Cloudflare's documentation states that a build fails when the configured name differs from the connected Worker, so merging to `main` should fail rather than replace the site. Running `wrangler deploy` by hand would create a separate Worker instead of touching production.
- `workers_dev` and `preview_urls` are off, so a deployed Worker has no public address until a custom domain is attached.
- `session: false` and `imageService: 'passthrough'` stop the adapter from provisioning KV or Images on first deploy.

## Local development

Requires Node 22.23.4 or newer, and pnpm.

```sh
pnpm install
pnpm dev                       # development server, in the Workers runtime
pnpm build && pnpm preview     # production build, in the Workers runtime
pnpm exec astro preview stop   # preview runs in the background
```

## Checks

```sh
pnpm check                # types and Astro diagnostics
pnpm test                 # unit tests
pnpm test:e2e             # end-to-end against a running preview, Chromium and Firefox
pnpm deploy:dry-run       # bundles without uploading anything
```

First run of the end-to-end tests needs `pnpm exec playwright install chromium firefox`.

CSP is only active in `build` + `preview`, not in `dev`, so end-to-end tests run against the preview.

## Cutover

Every step needs explicit approval at the time. Nothing here is automated.

1. All milestones approved on a tested preview environment.
2. Production D1 and R2 created, migrations applied, content seeded and reviewed.
3. Access policies for the admin host and private pages created and tested with a denied identity.
4. Secrets set on the production Worker.
5. In the Workers Builds settings: build command `pnpm build`, deploy command `pnpm exec wrangler deploy`, Node version pinned.
6. `name` in `wrangler.jsonc` changed to `folio`. This removes the safeguard, so it is its own reviewed commit.
7. Merge to `main`; the build deploys.
8. Verify production: public pages, admin denied when signed out, private page 404 when signed out, headers.

**Rollback:** restore the previous version from Workers → folio → Deployments. Content in D1 and R2 is not affected by a code rollback.
