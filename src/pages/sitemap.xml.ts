import type { APIRoute } from 'astro';
import { getDiscovery } from '@/content/load';
import { MENU } from '@/lib/route';

/** Public pages only, at their one address: unlisted pages and the internal Turkish copies are never listed. */
export const GET: APIRoute = async ({ site }) => {
  const { projects, apps } = await getDiscovery();
  const paths = ['/', ...MENU.map((m) => `/${m}`), '/privacy', ...projects.map((p) => `/projects/${p.id}`), ...apps.map((a) => `/${a.kind}/${a.id}`)];
  const urls = paths.map((p) => `  <url><loc>${new URL(p, site)}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, { headers: { 'Content-Type': 'application/xml' } });
};
