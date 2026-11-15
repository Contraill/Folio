# oztozlu.dev

The portfolio of İzzet Can Öztozlu, a full-stack developer: selected projects with a case study each, experience,
skills, a CV viewer and a way to get in touch, in English and Turkish.

It is a static site built with [Astro](https://astro.build), with no client framework. Cloudflare serves the built
files as they are (Workers static assets); there is no server code.

## Running it

Requires Node 26 (`.node-version`) and pnpm (the version in `package.json`, through Corepack).

```sh
pnpm install
pnpm dev          # development server
pnpm build        # the site in dist/
pnpm preview      # dist/ served the way Cloudflare serves it, at http://127.0.0.1:4321
pnpm check        # types
pnpm test:e2e     # the browser suite in Chromium and Firefox (starts the preview if it isn't running)
```

Two scripts prepare files that are committed rather than built every time:

- `pnpm cv` turns the CV PDFs in `public/cv/` into page images and a text layer for the CV viewer.
- `pnpm og` draws the share images in `public/og/` (1200×630, one for the home page and one per project).

## Where things are

| Path | What it holds |
| --- | --- |
| `src/data.ts` | Everything the site says outside the project write-ups, in both languages |
| `src/content/projects/` | One folder per project: `en.md`, and `tr.md` with the Turkish text |
| `src/components/`, `src/layouts/` | The pages' parts |
| `src/scripts/` | What moves: the terminal, Mochi, the koi, the constellation |
| `src/styles/global.css` | All styles |
| `public/` | Images, fonts, the CV, share images, `_headers` and `robots.txt` |
| `tests/e2e/` | The browser suite |

How to change the content: [docs/content.md](docs/content.md). How it is deployed: [docs/deployment.md](docs/deployment.md).

## License

The code is under the [MIT License](LICENSE). The text, the CV, the portrait, the project screenshots and the share
images are not: they describe me and my work, and may not be reused. The fonts are under the SIL Open Font License
(`public/fonts/OFL.txt`).
