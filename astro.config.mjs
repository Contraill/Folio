import { defineConfig } from 'astro/config';

// Static pages only: English at /, Turkish at /tr. No client framework.
export default defineConfig({
  site: 'https://oztozlu.dev',
  trailingSlash: 'never',
  // One .html file per page (projects/helios.html), as Cloudflare's nearest-404.html lookup needs for /tr/404.html.
  build: { format: 'file' },
  devToolbar: { enabled: false },
  // Pages start loading when a link is pointed at, so the next page is usually there by the click.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
