# Deployment

The site is static. Cloudflare's Worker `folio` serves `dist/` as built (Workers static assets, `wrangler.jsonc`) on
`oztozlu.dev`, with no code of its own. Every build and deploy runs in GitHub Actions; code reaches `main` only through
a pull request whose checks pass, and merging into `main` is the release.

## Branches

- `develop` is where work happens. It stays after every merge: each push to it updates the Preview.
- `main` is what is live. It changes only by merging a pull request from `develop`.

`main` is protected: a pull request can be merged only when CI's `checks` job has passed and the branch is up to date
with `main`. The rule applies to administrators too, `main` can't be force-pushed or deleted, and no review is
required.

## Workflows

| Trigger | Workflow | What happens |
| --- | --- | --- |
| Push to `develop` | Preview | Type check, build, deploy the Preview (`wrangler preview --name develop`), then the smoke tests against it through Access |
| *Run workflow* on Preview, with *full* | Preview | The same, with the whole browser suite against the Preview, and the smoke tests in WebKit too |
| Pull request into `main` | CI | Type check, build and the whole browser suite in Chromium and Firefox. Its `checks` job is required for merging |
| Merge into `main` | Production | Build and `wrangler deploy`, then a check that production serves this build |
| Refresh (*Run workflow* on Production) | Production | The same, for `main` as it is |

## Production safeguards

- **One deploy at a time.** Production runs share a concurrency group without cancelling a running job.
- **No stale build.** A run builds `main` as it is when the run starts and compares that commit with `main` again just
  before deploying. If `main` moved, it stops without deploying, and the newer run deploys.
- **A failed build changes nothing.** If the checks or the build fail, the job stops before deploying.
- **`/_build.json`** names the live build (commit and build time). After each deploy the job reads it from
  `oztozlu.dev` and fails unless it names this build (`scripts/check-live.ts`).

## Secrets

Kept as **environment** secrets, never repository secrets, so each workflow reaches only its own. None is in the code
or in a log.

| Environment (branch allowed) | Secrets |
| --- | --- |
| `preview` (`develop` only) | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` |
| `production` (`main` only) | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |

The Cloudflare tokens are account tokens that can edit the `folio` Worker only. CI has no secrets: a pull request from
a fork runs with a read-only token and never reaches an environment. Every workflow sets `permissions: contents: read`.

## What exists on Cloudflare

- The Worker `folio`, with the custom domain `oztozlu.dev`; `www.oztozlu.dev` and plain `http` are redirected to
  `https://oztozlu.dev` by the zone.
- Two account API tokens that can edit only that Worker, one per GitHub environment.
- A Cloudflare Access application in front of the Preview, and the service token `develop` its tests use.
- Web Analytics for `oztozlu.dev`, with automatic setup.
- The zone's mail records (Zoho) and the Google Search Console verification record.

## Preview

A push to `develop` updates the Preview at `https://develop-folio.<subdomain>.workers.dev`, behind Cloudflare Access.
Tests reach it with an Access service token (`tests/e2e/access.ts` adds its headers to requests for the Preview host
only and keeps it out of errors and traces). Cloudflare adds `X-Robots-Tag: noindex` to Preview responses.

When the service token is renewed in Cloudflare, set both values in the `preview` environment without them appearing
anywhere, from the file that holds them:

```sh
( set -a; . <token file>; set +a
  printf %s "$CF_ACCESS_CLIENT_ID"     | gh secret set CF_ACCESS_CLIENT_ID     --env preview
  printf %s "$CF_ACCESS_CLIENT_SECRET" | gh secret set CF_ACCESS_CLIENT_SECRET --env preview )
```

## How the files are served

- Addresses have no `.html` and no trailing slash: `/projects/helios` is `dist/projects/helios.html`.
- An unknown address gets the nearest `404.html` with status 404: under `/tr` the Turkish page, anywhere else the
  English one.
- `public/_headers` sets the security headers on every response, and a year of caching on `/_astro/*` and `/fonts/*`,
  whose names change when their content does.
- Cloudflare Web Analytics is added to the pages by Cloudflare itself (the zone's automatic setup); it uses no cookies.

## Search engines

`/sitemap.xml` lists every page with its other-language twin, and `/robots.txt` points to it. Each page names its
canonical address and its translation (`hreflang`), has a share image and, on the home page and project pages,
schema.org data. The site is registered in Google Search Console as the domain property `oztozlu.dev`.

## Local development and checks

`pnpm preview` serves `dist/` with `wrangler dev` at `http://127.0.0.1:4321`, the same way Cloudflare does, headers and
404 pages included. `pnpm test:e2e` runs the browser suite against it (and starts it if needed); against the Preview,
set `BASE_URL` and the Access token's two variables.

## Releasing

1. Push `develop` and look at the Preview.
2. Open a pull request from `develop` into `main`; CI must pass.
3. Merge it. Production deploys and checks itself; `/_build.json` on `oztozlu.dev` names the new commit.
4. Bring `develop` up to `main`, so the next pull request starts from the merge commit and is up to date:
   `git switch develop && git pull --ff-only origin main && git push origin develop`.
