/* Every page in both languages, each listing its other-language twin, so search engines pair them. */
import type { APIRoute } from 'astro';
import { caseOrder, localePath, type Locale } from '../data';

const SITE = 'https://oztozlu.dev';
const paths = ['/', '/cv', ...caseOrder.map((id) => `/projects/${id}`)];
const href = (locale: Locale, path: string) => SITE + (localePath(locale, path) === '/' ? '/' : localePath(locale, path));

export const GET: APIRoute = () => {
  const urls = paths.flatMap((path) => (['en', 'tr'] as const).map((locale) => [
    '  <url>',
    `    <loc>${href(locale, path)}</loc>`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${href('en', path)}"/>`,
    `    <xhtml:link rel="alternate" hreflang="tr" href="${href('tr', path)}"/>`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${href('en', path)}"/>`,
    '  </url>',
  ].join('\n')));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
