import { defineMiddleware } from 'astro:middleware';
import { resolveLocale } from './i18n/locale';

export const onRequest = defineMiddleware(async ({ locals, request, url }, next) => {
  locals.locale = resolveLocale(url, request.headers.get('cookie'), request.headers.get('accept-language'));
  const response = await next();
  const headers = response.headers;
  headers.set('Content-Language', locals.locale);
  // The same URL differs by language, so shared caches must not mix the variants.
  headers.append('Vary', 'Cookie, Accept-Language');
  // Short and private: long enough for a prefetched page to be reused, never kept by shared caches.
  // Pages with private content will have to opt back into no-store.
  headers.set('Cache-Control', 'private, max-age=60');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
});
