import type { APIRoute } from 'astro';
import type { SearchIndex } from '@/components/SearchPalette';
import { DOMAINS, PROJECTS } from '@/content/projects';
import { messages } from '@/i18n/messages';
import { MENU } from '@/lib/route';

/** Public entries only: unlisted and private pages must never appear here. */
export const GET: APIRoute = ({ locals }) => {
  const t = messages[locals.locale];
  const index: SearchIndex = {
    projects: PROJECTS.map((p) => ({ href: `/projects/${p.id}`, name: p.name, meta: p.lang, terms: `${p.lang} ${DOMAINS[p.d]} ${p.topics.join(' ')}` })),
    pages: (['home', ...MENU] as const).map((route) => ({ href: route === 'home' ? '/' : `/${route}`, label: t.nav[route], note: '' })),
  };
  return Response.json(index);
};
