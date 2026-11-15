import { getCollection } from 'astro:content';
import type { Locale } from '../data';

export type Img = { src: string; w: number; h: number };
export type Section = { kind?: 'overview'; title: string; paras?: string[]; list?: [string, string][]; gal?: [Img, string][] };
export type Case = { lede: string; stack: string; facts?: [string, string][]; sections: Section[] };
export type Project = {
  id: string; name: string; repo?: string; home?: string; lang: string; since: string; desc: string;
  img?: Img; hero?: Img; pos?: string; case?: Case;
};

/** Every project in one language: the Turkish fields laid over the English ones. */
export async function loadProjects(locale: Locale): Promise<Map<string, Project>> {
  const byId = new Map<string, Partial<Record<Locale, Record<string, unknown>>>>();
  for (const entry of await getCollection('projects')) {
    const [id, lang] = entry.id.split('/') as [string, Locale];
    byId.set(id, { ...byId.get(id), [lang]: entry.data as Record<string, unknown> });
  }
  const out = new Map<string, Project>();
  for (const [id, files] of byId) {
    if (!files.en) throw new Error(`src/content/projects/${id}: en.md is missing`);
    out.set(id, { ...files.en, ...(locale === 'tr' ? files.tr : {}), id } as Project);
  }
  return out;
}

export const repoUrl = (p: Project) => (p.repo ? `https://github.com/Contraill/${p.repo}` : undefined);
