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

/* Games and lab apps run at /play/<id>/app/ and /lab/<id>/app/: their files are part of this build (scripts/postbuild.ts
   unpacks the controller's checked builds there). Same origin as Folio, so Folio can frame them and their saved games
   and runs stay with the site; each app gets its own policy: its own files only, WebAssembly allowed, framed by Folio
   alone. An address the app doesn't have gets its page (single-page apps), with a <base> so its files still load. */
export const APP_PATH = /^\/(play|lab)\/([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\/app(\/.*)?$/;
export const APP_HEADERS: Record<string, string> = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self' data: blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Robots-Tag': 'noindex',
};
const HASHED = /[.-][A-Za-z0-9_-]{8,}\.(js|mjs|css|wasm|woff2?|png|jpe?g|webp|avif|svg|gif|mp3|ogg|wav)$/;

export async function respondApp(request: Request, assets: Assets, match: RegExpExecArray): Promise<Response> {
  const url = new URL(request.url);
  const [, kind, id, rest] = match;
  const root = `/${kind}/${id}/app`;
  // Relative file paths need the trailing slash.
  if (rest === undefined) return new Response(null, { status: 308, headers: { Location: `${root}/${url.search}`, ...APP_HEADERS } });
  const page = async (base: boolean) => {
    // The assets layer drops trailing slashes: the folder without one is its index.html, with no redirect.
    const res = await assets.fetch(new Request(new URL(root, url)));
    if (!res.ok) return null;
    let html = await res.text();
    if (base) html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (h) => `${h}<base href="${root}/">`) : `<base href="${root}/">${html}`;
    return new Response(request.method === 'HEAD' ? null : html, { status: 200, headers: { ...APP_HEADERS, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
  };
  if (rest === '/' || rest === '/index.html') return (await page(false)) ?? notFound();
  const asset = await assets.fetch(new Request(new URL(`${root}${rest}`, url)));
  if (asset.ok) {
    const headers = new Headers(APP_HEADERS);
    headers.set('Content-Type', asset.headers.get('Content-Type') ?? 'application/octet-stream');
    headers.set('Cache-Control', HASHED.test(rest) ? 'public, max-age=31536000, immutable' : 'no-cache');
    return new Response(request.method === 'HEAD' ? null : asset.body, { status: 200, headers });
  }
  // A path with no file extension is a route of a single-page app; a missing file stays missing.
  if (!/\.[a-z0-9]{1,8}$/i.test(rest)) return (await page(true)) ?? notFound();
  return notFound();
}
const notFound = () => new Response('Not found', { status: 404, headers: { ...SECURITY_HEADERS, 'X-Robots-Tag': 'noindex' } });

export async function respond(request: Request, assets: Assets, routes: Routes): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD', ...SECURITY_HEADERS } });
  const url = new URL(request.url);
  const app = APP_PATH.exec(url.pathname);
  if (app) return respondApp(request, assets, app);
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
