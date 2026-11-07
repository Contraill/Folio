import type { APIRoute } from 'astro';
import type { SearchIndex } from '@/components/SearchPalette';
import { getContent } from '@/content/load';
import { localePaths } from '@/lib/locales';
import { areasFor } from '@/content/site';
import { messages } from '@/i18n/messages';
import { MENU } from '@/lib/route';

export const getStaticPaths = localePaths;

/** Public entries only: unlisted and private pages must never appear here. */
export const GET: APIRoute = async ({ locals }) => {
  const t = messages[locals.locale];
  const areas = areasFor(locals.locale);
  const { projects, apps } = await getContent(locals);
  const index: SearchIndex = {
    projects: projects.map((p) => ({ href: `/projects/${p.id}`, name: p.name, meta: p.lang, terms: `${p.lang} ${areas[p.d]} ${p.topics.join(' ')}` })),
    pages: [
      ...(['home', ...MENU] as const).map((route) => ({ href: route === 'home' ? '/' : `/${route}`, label: t.nav[route], note: '' })),
      ...apps.map((a) => ({ href: `/${a.kind}/${a.id}`, label: a.name, note: t.nav[a.kind] })),
    ],
  };
  return Response.json(index);
};
