# Folio

Personal website of İzzet Can Öztozlu, for [oztozlu.dev](https://oztozlu.dev).

This branch holds the production application: a highly interactive portfolio on Astro and Cloudflare Workers, with persistent admin-managed content on the way. The live site still serves the coming-soon page from `main`.

**Status:** the foundation and shared design system are in place. Most pages are still stubs. See the [roadmap](docs/roadmap.md).

## Stack

Astro · TypeScript · React islands · Cloudflare Workers with Static Assets. Planned: D1, R2, Cloudflare Access.

## Getting started

Requires Node 22.23.4 or newer, and pnpm.

```sh
pnpm install
pnpm dev
```

More commands, including tests and the production preview, are in [docs/deployment.md](docs/deployment.md).

## Layout

```text
src/
  pages/        Routes
  layouts/      Page shell
  components/   Astro components and React islands
  lib/          Motion, notched panels, client state, routing helpers
  i18n/         Language negotiation and interface strings
  content/      Seed content until the content store exists
  styles/       Design system
public/         Fonts and other static files
tests/e2e/      Browser tests
archive/        The coming-soon page, unchanged
docs/           Technical documentation
```

## Documentation

- [Architecture](docs/architecture.md): how the application is built and why
- [Content model](docs/content-model.md): the persistent content store
- [Roadmap](docs/roadmap.md): milestones and risks
- [Deployment](docs/deployment.md): commands, safeguards and the cutover plan
- [Migration audit](docs/migration-audit.md): prototype versus production, page by page

## Fonts

Archivo, Geist, Geist Mono and Instrument Serif are self-hosted under the SIL Open Font License; see `public/fonts/OFL.txt`.
