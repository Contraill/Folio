import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://oztozlu.dev',
  output: 'server',
  adapter: cloudflare({ imageService: 'passthrough' }),
  integrations: [react()],
  // Without this the adapter provisions a KV namespace on first deploy.
  session: false,
  build: { inlineStylesheets: 'never' },
  security: {
    csp: {
      directives: ["default-src 'self'", "img-src 'self' data:", "base-uri 'self'", "form-action 'self'", "object-src 'none'", "frame-ancestors 'none'"],
      // Components set CSS variables through style attributes; scripts stay locked to hashes.
      styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
    },
  },
  devToolbar: { enabled: false },
});
