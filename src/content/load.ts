/* Everything a page renders, gathered once per language at build: page copy from src/content/pages, projects from
   the GitHub snapshot (.folio/github.json, written by scripts/fetch-github.ts) merged with src/content/projects.
   Folio's own files are checked here and any error stops the build, a missing Turkish version included: every page
   group and every project written in Folio needs both languages. Only what GitHub supplies (a repository's
   description) may be English-only, and the page says so next to that text. */
import { readFileSync, writeFileSync } from 'node:fs';
import { getImage } from 'astro:assets';
import { getCollection } from 'astro:content';
import type { Locale } from '../i18n/locale';
import { type Activity, discover, localize, type Discovery, type ManualProject, type Snapshot } from './discover';
import { type Case, type Img, PAGE_GROUPS, PageBodies, type Pages, type Project, ProjectEntry, ProjectTranslation } from './schema';

/** A game or lab app in one language: it runs at its own address and Folio frames it. */
export type AppPage = {
  kind: 'play' | 'lab'; id: string; name: string; summary: string; path: string; embed: boolean; aspect: string;
  inputs: string[]; repoUrl: string | null; lang: string | null; stars: number; updated: string; translated: boolean;
};

export type Content = {
  pages: Pages; projects: Project[]; hero: Project[]; selected: Project[]; cases: Record<string, Case>; apps: AppPage[];
  activity: Activity[]; fetchedAt: string;
  /** Projects whose description has no Turkish version (only repositories Folio has nothing written about), by id. */
  untranslated: Set<string>;
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
    if (!files.en || !files.tr) throw new Error(`src/content/projects/${id}: en.md and tr.md are both required`);
    const en = ProjectEntry.parse(files.en), tr = ProjectTranslation.parse(files.tr);
    if (!tr.desc) throw new Error(`src/content/projects/${id}/tr.md: desc is required`);
    if (en.case && !tr.case) throw new Error(`src/content/projects/${id}/tr.md: the case study needs its Turkish version`);
    return { id, en, tr };
  });
  const found = discover(snapshot(), manual, SELF);
  for (const w of found.warnings) console.warn(`[folio] ${w}`);
  // Counts for /_build.json (scripts/postbuild.ts).
  const apps = (kind: string) => found.apps.filter((a) => a.kind === kind).length;
  const written = found.projects.filter((p) => p.en.case).length;
  writeFileSync('.folio/discovery.json', JSON.stringify({ projects: found.projects.length, written, play: apps('play'), lab: apps('lab') }));
  // The apps scripts/postbuild.ts unpacks: exactly the ones this build lists.
  writeFileSync('.folio/apps.json', JSON.stringify(found.apps.map((a) => ({ kind: a.kind, id: a.id, build: a.build }))));
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
  const copy = Object.fromEntries(PAGE_GROUPS.map((group) => {
    const files = groups.get(group);
    if (!files?.en || !files.tr) throw new Error(`src/content/pages/${group}: en.md and tr.md are both required`);
    // Checked against its schema, then used as written so key order and text stay exactly as in the file.
    for (const lang of ['en', 'tr'] as const) PageBodies[group].parse(files[lang]);
    return [group, files[locale]!];
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
  const apps = found.apps.map((a): AppPage => ({
    kind: a.kind, id: a.id, path: `/${a.kind}/${a.id}/app/`, embed: a.embed, aspect: a.aspect, inputs: a.inputs,
    name: (locale === 'tr' && a.title.tr) || a.title.en, summary: (locale === 'tr' && a.summary.tr) || a.summary.en,
    repoUrl: a.repo, lang: a.language, stars: a.stars, updated: a.updated.slice(0, 10),
    translated: locale === 'en' || !!a.summary.tr,
  }));
  return { pages, projects, hero: pick(found.hero), selected: pick(found.selected), cases, apps, activity: found.activity, fetchedAt: snapshot().fetchedAt, untranslated };
};

/** This page's content, in its language. */
export const getContent = (locals: App.Locals) => {
  if (!cache.has(locals.locale)) cache.set(locals.locale, load(locals.locale));
  return cache.get(locals.locale)!;
};
