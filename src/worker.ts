/* The only code that runs per request: picks the English or Turkish version of a static page. See
   src/lib/language-worker.ts. Static files (/_astro, fonts, images, CV PDFs…) never reach it; see
   assets.run_worker_first in wrangler.jsonc. */
import routes from '../.folio/routes.json';
import { respond } from './lib/language-worker';

export default {
  fetch: (request, env) => respond(request, env.ASSETS, routes),
} satisfies ExportedHandler<Env>;
