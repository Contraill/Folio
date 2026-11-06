/* The shared page cache (Workers Cache) and the rules that keep it safe. See "Edge caching" in docs/architecture.md.

   A request reaches the cache only when all of these hold: this environment allows it (PAGE_CACHE), the runtime
   switch in the store is on, it is a GET or HEAD without credentials, and the store answered. The language and the
   cache generation are part of the key, cookies and headers are not passed to the cached renderer, and only pages
   that mark themselves public and published are stored. Anything else is rendered directly, as without a cache. */
import type { Locale } from '../i18n/locale.ts';

/* Internal request headers, set by the gateway only. Anything arriving from outside with these names is removed. */
export const VIA_CACHE = 'x-folio-via-cache';
export const LANG = 'x-folio-lang';

/* How long a shared copy may be kept. Freshness never depends on it: a publish raises the generation. */
export const SHARED_MAX_AGE = 300;
export const BROWSER_CACHE_CONTROL = 'private, max-age=60';

export type PageCacheEnv = { PAGE_CACHE?: string; DB?: { prepare(sql: string): { all<T>(): Promise<{ results: T[] }> } } };

/** The generation to key on, or null when this request must not use the shared cache. */
export async function sharedCacheGeneration(request: Request, env: PageCacheEnv): Promise<number | null> {
  if (env.PAGE_CACHE !== 'allowed' || !env.DB) return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;
  if (request.headers.has('authorization')) return null;
  try {
    const { results } = await env.DB.prepare("SELECT key, value FROM meta WHERE key IN ('page_cache', 'cache_generation')").all<{ key: string; value: string }>();
    const state = Object.fromEntries(results.map((r) => [r.key, r.value]));
    const generation = Number(state.cache_generation);
    return state.page_cache === 'on' && Number.isInteger(generation) ? generation : null;
  } catch {
    return null; // the switch can't be read: fail closed, render without the cache
  }
}

/** A copy of the request that carries nothing personal: the cached renderer must not depend on anything outside its key. */
export function anonymous(request: Request, locale: Locale) {
  const headers = new Headers({ [VIA_CACHE]: '1', [LANG]: locale });
  for (const name of ['accept', 'accept-encoding', 'user-agent']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Request(request.url, { method: request.method, headers });
}

/** Removes the internal headers from a request that came from outside. */
export function stripInternal(request: Request) {
  if (!request.headers.has(VIA_CACHE) && !request.headers.has(LANG)) return request;
  const clean = new Request(request);
  clean.headers.delete(VIA_CACHE);
  clean.headers.delete(LANG);
  return clean;
}

/** What browsers receive for a page that went through the shared cache: the same headers as without it. */
export function forBrowser(response: Response) {
  const out = new Response(response.body, response);
  const cacheControl = out.headers.get('cache-control') ?? '';
  out.headers.set('cache-control', /no-store/.test(cacheControl) ? cacheControl : BROWSER_CACHE_CONTROL);
  out.headers.set('vary', 'Cookie, Accept-Language');
  out.headers.set('x-page-cache', 'on');
  return out;
}

/** Response headers for a page rendered behind the cache: shared only when the page says it is public and published. */
export const sharedCacheControl = (cacheable: boolean, status: number) =>
  cacheable && status === 200 ? `public, s-maxage=${SHARED_MAX_AGE}` : BROWSER_CACHE_CONTROL;
