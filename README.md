# Folio

Personal website of İzzet Can Öztozlu, for [oztozlu.dev](https://oztozlu.dev).

This branch holds the new site: an interactive portfolio built as static pages on Astro, with projects read from GitHub at build time and a small Worker that picks English or Turkish per visitor. The live site still serves the coming-soon page from `main`.

**Status:** static site, content, CV, GitHub projects, games, lab apps and private sites (through the Folio controller and its templates) are in place on `develop`; going live is next. See the [roadmap](docs/roadmap.md).

[![Production](https://github.com/Contraill/Folio/actions/workflows/production.yml/badge.svg)](https://github.com/Contraill/Folio/actions/workflows/production.yml)

## Stack

Astro (static) · TypeScript · React islands · Cloudflare Workers with Static Assets · GitHub Actions.

## Getting started

Requires Node 26 (`.node-version`) and pnpm 12.

```sh
pnpm install
pnpm dev
```

More commands, including tests and the production preview, are in [docs/deployment.md](docs/deployment.md).

## Layout

```text
src/
  pages/        Routes, each built in English and Turkish ([...locale])
  layouts/      Page shell
  components/   Astro components and React islands
  content/      Page copy and projects (content collections), schemas, GitHub discovery
  lib/          Motion, notched panels, client state, routing, the language Worker's logic
  i18n/         Language negotiation and interface strings
  styles/       Design system
  worker.ts     The language Worker
scripts/        GitHub data before the build, route list and /_build.json after it, the post-deploy check
public/         Fonts, images, the CV PDFs
tests/          Browser tests and the recorded GitHub snapshot
.github/        CI, Preview and Production workflows
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
