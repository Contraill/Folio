import { existsSync, readFileSync } from 'node:fs';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import { appOrigins } from './src/content/discover.ts';

// Pages may frame only the games and lab apps this build shows (from the GitHub snapshot written before the build).
const SNAPSHOT = '.folio/github.json';
const SELF = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'Folio';
const frames = existsSync(SNAPSHOT) ? appOrigins(JSON.parse(readFileSync(SNAPSHOT, 'utf8')), SELF) : [];

/* Static: every page is built in English and Turkish, and a small Worker (src/worker.ts) picks one per visitor. */
export default defineConfig({
  site: 'https://oztozlu.dev',
  output: 'static',
  trailingSlash: 'never',
  integrations: [react()],
  build: { inlineStylesheets: 'never' },
  // Social previews of GitHub projects are downloaded and optimised at build, then served from this site.
  image: { remotePatterns: [{ protocol: 'https', hostname: 'opengraph.githubassets.com' }, { protocol: 'https', hostname: 'repository-images.githubusercontent.com' }] },
  security: {
    csp: {
      // frame-ancestors can't be set from a meta tag: the language Worker sends it as a header.
      directives: ["default-src 'self'", "img-src 'self' data:", "base-uri 'self'", "form-action 'self'", "object-src 'none'", `frame-src ${frames.join(' ') || "'none'"}`],
      // Components set CSS variables through style attributes; scripts stay locked to hashes.
      styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
    },
  },
  // Content is frontmatter only: no Markdown code blocks to highlight, and Shiki's inline styles don't suit the CSP.
  markdown: { syntaxHighlight: false },
  devToolbar: { enabled: false },
  // Pages start loading on hover, focus or touch, so a click usually finds them ready.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
