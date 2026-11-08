export const LOCALES = ['en', 'tr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'lang';

const asLocale = (value: string | null | undefined): Locale | null => {
  const base = value?.trim().toLowerCase().split('-')[0];
  return LOCALES.find((locale) => locale === base) ?? null;
};

/** First supported language of an Accept-Language header, honouring q-values. */
export function fromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const weight = q ? Number(q.slice(2)) : 1;
      return { locale: asLocale(tag), weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((entry) => entry.locale && entry.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  return ranked[0]?.locale ?? null;
}

export function fromCookie(header: string | null): Locale | null {
  const pair = header?.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${LOCALE_COOKIE}=`));
  return asLocale(pair?.slice(LOCALE_COOKIE.length + 1));
}

/** Explicit link (?lang=) wins, then the visitor's saved choice, then the browser, then English. */
export function resolveLocale(url: URL, cookie: string | null, acceptLanguage: string | null): Locale {
  return asLocale(url.searchParams.get('lang')) ?? fromCookie(cookie) ?? fromAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE;
}
