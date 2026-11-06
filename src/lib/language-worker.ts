/* What the language Worker does with a request. Every page is built twice, English at its address and Turkish under
   the internal prefix; this picks one for the visitor and sets the response headers itself, since _headers applies
   only to static files served without the Worker. Pure apart from the asset fetch, so it is unit-tested.
   Relative imports only: the unit tests load this file in Node. */
import { resolveLocale } from '../i18n/locale.ts';
import { TR_PREFIX } from './locales.ts';

export type Route = { tr: boolean; unlisted: boolean };
/** Built from the static output by scripts/postbuild.ts and bundled into the Worker; never a public file. */
export type Routes = Record<string, Route>;
type Assets = { fetch(request: Request): Promise<Response> };

export const NOT_FOUND = '/not-found';
export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': "frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/** The page an address names, or null when it reaches for the internal prefix in any spelling. */
export function routeKey(pathname: string): string | null {
  let path: string;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  path = path.replace(/\/{2,}/g, '/');
  if (new RegExp(`^${TR_PREFIX}(/|$)`, 'i').test(path)) return null;
  path = path.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '');
  return path.length > 1 ? path.replace(/\/+$/, '') || '/' : '/';
}

export async function respond(request: Request, assets: Assets, routes: Routes): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD', ...SECURITY_HEADERS } });
  const url = new URL(request.url);
  const key = routeKey(url.pathname);
  const route = key === null ? undefined : routes[key];
  const locale = resolveLocale(url, request.headers.get('cookie'), request.headers.get('accept-language'));
  const target = route ? key! : NOT_FOUND;
  // Turkish when asked for and built; otherwise the English file (the page notes a missing translation itself).
  const tr = locale === 'tr' && (route?.tr ?? true);
  const file = tr ? `${TR_PREFIX}${target === '/' ? '' : target}` : target;
  const asset = await assets.fetch(new Request(new URL(file, url)));
  if (!asset.ok) return new Response('Not found', { status: 404, headers: { ...SECURITY_HEADERS, 'X-Robots-Tag': 'noindex' } });

  const headers = new Headers(SECURITY_HEADERS);
  headers.set('Content-Type', asset.headers.get('Content-Type') ?? 'text/html; charset=utf-8');
  headers.set('Content-Language', tr ? 'tr' : 'en');
  // The same address serves two languages: shared caches must keep them apart.
  headers.set('Vary', 'Cookie, Accept-Language');
  // Short and private: long enough for a prefetched page to be reused, never kept by shared caches.
  headers.set('Cache-Control', 'private, max-age=60');
  if (!route || route.unlisted) headers.set('X-Robots-Tag', 'noindex');
  return new Response(request.method === 'HEAD' ? null : asset.body, { status: route ? 200 : 404, headers });
}
