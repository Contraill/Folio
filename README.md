# Folio

Personal website of İzzet Can Öztozlu, live at [oztozlu.dev](https://oztozlu.dev).

For now it is a single coming-soon page set at dawn. A big "Coming soon." stands on the horizon in chunky block letters, and the letters aren't glued down: visitors can grab one and throw it, and it falls, bounces and walks back to its spot. Typing a letter makes the matching letters hop, and the page answers back if you keep playing long enough. The full portfolio will replace this page later.

The page is plain HTML, CSS and a little vanilla JavaScript. It has no build step, framework or runtime dependencies.

## Structure

```text
Folio/
├── public/                 # Everything served to visitors
│   ├── index.html          # Page markup, metadata, language pre-selection
│   ├── styles.css          # Dawn sky, block-letter headline, layout
│   ├── script.js           # Letter physics and interactions, TR/EN switching
│   └── fonts/              # Bricolage Grotesque variable font (latin + latin-ext), SIL OFL 1.1
├── wrangler.jsonc          # Cloudflare Workers Static Assets config
└── README.md
```

### Notes

- **Letters.** `script.js` splits the headline into letters and gives each one a tiny physics body: gravity, a bounce on the horizon, and a spring that pulls it back home. Mouse, touch and pen all use Pointer Events. The animation loop runs only while a letter is moving and stops once everything is back in place.
- **Accessibility.** Screen readers get the headline as one plain sentence; the separate letters are hidden from them. Keyboard users can trigger the same hops and replies by typing.
- **Languages.** The page is available in English and Turkish on the same URL. A small inline script in `<head>` picks the language before first paint: a saved manual choice (`localStorage` key `lang`) wins, then the first of `tr`/`en` found in `navigator.languages`, otherwise English. All strings live in `public/script.js`. The static HTML is English, which is also what visitors without JavaScript and crawlers see.
- **Reduced motion.** With `prefers-reduced-motion: reduce`, letters stay put: there is no entrance, physics or text fade. The page is designed to read well as a still image.

## Local development

Any static file server works:

```sh
python3 -m http.server 8787 -d public
# open http://localhost:8787
```

To run it in the actual Workers runtime instead:

```sh
npx wrangler dev
```

Check the Wrangler config without deploying:

```sh
npx wrangler deploy --dry-run
```

## Hosting: Cloudflare Workers Static Assets

The site is a Cloudflare Worker named `folio` that only serves static assets (this is not Cloudflare Pages). `wrangler.jsonc` sets:

- `assets.directory: "./public"`: every file in `public/` is served as-is, and `/` serves `public/index.html`.
- No Worker script, routes, account ID or secrets.
- Observability: persisted invocation logs at a sampling rate of 1, query strings redacted, traces off, issue detection on (`observability.issues` needs Wrangler 4.134.0 or newer).

The custom domain `oztozlu.dev` is attached to the Worker in the Cloudflare dashboard, not in `wrangler.jsonc`, so deployments leave it alone.

## Deployment

Cloudflare Workers Builds is connected to this repository:

- Production branch: `main`
- Build command: none
- Deploy command: `npx wrangler deploy`
- Preview builds: disabled

Every push to `main` triggers a build that runs `npx wrangler deploy` and publishes `public/` to the `folio` Worker. There is no manual deploy step. Build logs are in the Cloudflare dashboard under Workers & Pages → folio → Deployments.
