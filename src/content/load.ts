/* Everything a page renders, gathered once per language at build: page copy from src/content/pages, projects from
   the GitHub snapshot (.folio/github.json, written by scripts/fetch-github.ts) merged with src/content/projects.
   Folio's own files are checked here and any error stops the build. */
import { readFileSync, writeFileSync } from 'node:fs';
import { getImage } from 'astro:assets';
import { getCollection } from 'astro:content';
import type { Locale } from '../i18n/locale';
import { discover, localize, type Discovery, type ManualProject, type Snapshot } from './discover';
import { type Case, type Img, PAGE_GROUPS, PageBodies, type Pages, type Project, ProjectEntry, ProjectTranslation } from './schema';

export type Content = {
  pages: Pages; projects: Project[]; featured: Project[]; selected: Project[]; cases: Record<string, Case>;
  /** Projects whose text has no Turkish version yet, by id. */
  untranslated: Set<string>;
  /** Page groups shown in English because their Turkish file is missing. */
  fallbackGroups: Set<string>;
};

const SELF = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'Folio';
export const snapshot = (): Snapshot => JSON.parse(readFileSync('.folio/github.json', 'utf8'));

const byLang = <T extends { id: string; data: unknown }>(entries: T[]) => {
  const out = new Map<string, Partial<Record<Locale, unknown>>>();
  for (const e of entries) {
    const [id, lang] = e.id.split('/');
    out.set(id, { ...out.get(id), [lang]: e.data });
  }
  return out;
};

let discovery: Promise<Discovery> | undefined;
/** The projects and apps this build shows, decided once for both languages. */
export const getDiscovery = () => (discovery ??= (async () => {
  const manual: ManualProject[] = [...byLang(await getCollection('projects'))].map(([id, files]) => {
    if (!files.en) throw new Error(`src/content/projects/${id}: en.md is required`);
    return { id, en: ProjectEntry.parse(files.en), tr: files.tr === undefined ? undefined : ProjectTranslation.parse(files.tr) };
  });
  const found = discover(snapshot(), manual, SELF);
  for (const w of found.warnings) console.warn(`[folio] ${w}`);
  // Counts for /_build.json (scripts/postbuild.ts).
  const apps = (kind: string) => found.apps.filter((a) => a.kind === kind).length;
  writeFileSync('.folio/discovery.json', JSON.stringify({ projects: found.projects.length, play: apps('play'), lab: apps('lab') }));
  return found;
})());

/* Social previews become files of this site at build: no request goes to GitHub from a visitor's browser. */
const images = new Map<string, Promise<Img | undefined>>();
const localImage = (url: string) => {
  if (!images.has(url)) images.set(url, getImage({ src: url, inferSize: true, width: 1200, format: 'webp' })
    .then((r) => ({ src: r.src, w: Number(r.attributes.width), h: Number(r.attributes.height) }))
    .catch((e) => { console.warn(`[folio] social preview not used: ${(e as Error).message.split('\n')[0]}`); return undefined; }));
  return images.get(url)!;
};

const cache = new Map<Locale, Promise<Content>>();
const load = async (locale: Locale): Promise<Content> => {
  const groups = byLang(await getCollection('pages'));
  const fallbackGroups = new Set<string>();
  const copy = Object.fromEntries(PAGE_GROUPS.map((group) => {
    const files = groups.get(group);
    if (!files?.en) throw new Error(`src/content/pages/${group}: en.md is required`);
    // Checked against its schema, then used as written so key order and text stay exactly as in the file.
    for (const lang of ['en', 'tr'] as const) if (files[lang] !== undefined) PageBodies[group].parse(files[lang]);
    if (locale === 'tr' && files.tr === undefined) fallbackGroups.add(group);
    return [group, (locale === 'tr' && files.tr) || files.en];
  })) as Record<string, Record<string, unknown>>;
  const { shared, ...rest } = copy;
  const pages = { ...shared, ...rest } as Pages;

  const found = await getDiscovery();
  const cases: Record<string, Case> = {};
  const untranslated = new Set<string>();
  const projects = await Promise.all(found.projects.map(async (listing) => {
    const image = listing.remoteImage ? await localImage(listing.remoteImage) : undefined;
    const { project, study, translated } = localize(listing, locale, image);
    if (study) cases[project.id] = study;
    if (!translated) untranslated.add(project.id);
    return project;
  }));
  const pick = (ids: string[]) => ids.map((id) => projects.find((p) => p.id === id)!).filter(Boolean);
  return { pages, projects, featured: pick(found.featured), selected: pick(found.selected), cases, untranslated, fallbackGroups };
};

/** This page's content, in its language. */
export const getContent = (locals: App.Locals) => {
  if (!cache.has(locals.locale)) cache.set(locals.locale, load(locals.locale));
  return cache.get(locals.locale)!;
};
