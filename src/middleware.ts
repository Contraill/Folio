import { defineMiddleware } from 'astro:middleware';
import { LOCALES, resolveLocale, type Locale } from './i18n/locale';
import { BROWSER_CACHE_CONTROL, LANG, sharedCacheControl, VIA_CACHE } from './lib/edge-cache';

export const onRequest = defineMiddleware(async ({ locals, request, url }, next) => {
  // Behind the shared cache the gateway has already chosen the language and removed cookies and headers; it is the
  // only one that can set these headers, as it strips them from every request arriving from outside.
  const viaCache = request.headers.get(VIA_CACHE) === '1';
  const chosen = request.headers.get(LANG) as Locale | null;
  locals.locale = viaCache && chosen && LOCALES.includes(chosen) ? chosen : resolveLocale(url, request.headers.get('cookie'), request.headers.get('accept-language'));
  const response = await next();
  const headers = response.headers;
  headers.set('Content-Language', locals.locale);
  if (viaCache) {
    // Kept by the shared cache only if the page said it is public and published. The gateway restores the
    // browser headers below before anything leaves the Worker.
    headers.set('Cache-Control', sharedCacheControl(!!locals.cacheable, response.status));
  } else {
    // The same URL differs by language, so shared caches must not mix the variants.
    headers.append('Vary', 'Cookie, Accept-Language');
    // Short and private: long enough for a prefetched page to be reused, never kept by shared caches.
    // Pages with private content will have to opt back into no-store.
    headers.set('Cache-Control', BROWSER_CACHE_CONTROL);
  }
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
});
