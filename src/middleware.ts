import { defineMiddleware } from 'astro:middleware';
import { TR_PREFIX } from './lib/locales';

/* Runs while pages are built: a page under the internal Turkish prefix is the Turkish version of the address
   without it. Response headers are set by the language Worker (src/worker.ts), not here. */
export const onRequest = defineMiddleware(({ locals, url }, next) => {
  const tr = url.pathname === TR_PREFIX || url.pathname.startsWith(`${TR_PREFIX}/`);
  locals.locale = tr ? 'tr' : 'en';
  locals.path = tr ? url.pathname.slice(TR_PREFIX.length) || '/' : url.pathname;
  return next();
});
