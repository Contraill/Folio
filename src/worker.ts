/* The Worker. The default export is a gateway that is never cached itself: it decides whether a page may come
   from the shared cache, and if so asks the Pages entrypoint, which the cache stands in front of, keyed on the
   path, the language and the cache generation. See src/lib/edge-cache.ts. */
import { handle } from '@astrojs/cloudflare/handler';
import { WorkerEntrypoint } from 'cloudflare:workers';
import { resolveLocale, type Locale } from './i18n/locale.ts';
import { anonymous, forBrowser, sharedCacheGeneration, stripInternal } from './lib/edge-cache.ts';

type Props = { lang: Locale; generation: number };

export class Pages extends WorkerEntrypoint<Env, Props> {
  fetch(request: Request) {
    return handle(request, this.env, this.ctx);
  }
}

export default {
  async fetch(request, env, ctx) {
    const clean = stripInternal(request);
    const generation = await sharedCacheGeneration(clean, env);
    if (generation === null) return handle(clean, env, ctx); // exactly as without a cache
    const lang = resolveLocale(new URL(clean.url), clean.headers.get('cookie'), clean.headers.get('accept-language'));
    const response = await ctx.exports.Pages({ props: { lang, generation } }).fetch(anonymous(clean, lang));
    return forBrowser(response);
  },
} satisfies ExportedHandler<Env>;
