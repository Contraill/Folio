import type { APIRoute } from 'astro';
import type { SearchIndex } from '@/components/SearchPalette';
import { areasFor, listedProjects } from '@/content/projects';
import { messages } from '@/i18n/messages';
import { MENU } from '@/lib/route';

/** Public entries only: unlisted and private pages must never appear here. */
export const GET: APIRoute = ({ locals }) => {
  const t = messages[locals.locale];
  const areas = areasFor(locals.locale);
  const index: SearchIndex = {
    projects: listedProjects(locals.locale).map((p) => ({ href: `/projects/${p.id}`, name: p.name, meta: p.lang, terms: `${p.lang} ${areas[p.d]} ${p.topics.join(' ')}` })),
    pages: (['home', ...MENU] as const).map((route) => ({ href: route === 'home' ? '/' : `/${route}`, label: t.nav[route], note: '' })),
  };
  return Response.json(index);
};
