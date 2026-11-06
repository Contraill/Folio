/* Which projects, games and lab apps the site shows, from the GitHub snapshot of this build and the projects written
   in Folio. Pure: no network, no files, so every rule below is unit-tested. Relative imports only (Node loads it).

   - Only public repositories count, and never Folio's own. Topics sort them: `folio-play` and `folio-lab` are apps,
     `folio` is a project.
   - A repository whose `.github/folio.yaml` doesn't fit its schema is left out, with a warning; the build goes on.
   - A project written in Folio is linked to its repository by `repo`. It shows while that repository is public and
     either has the `folio` topic or the Folio entry says `listed: true`. A repository that went private or was deleted
     takes its project with it. Without `repo`, a Folio entry shows when listed.
   - A repository is shown once: a Folio entry for it absorbs the GitHub card.
   - Folio's text, images (or their absence) and case study win over GitHub's; GitHub's stars, last push and language
     win over Folio's. Social previews are used only for projects Folio has no entry for.
   - Order: entries with an `order` first, ascending; then the rest by last push, newest first.
   - Featured: pinned repositories that have the `folio` topic, in pin order, at most six. Until there is one, the
     Folio entries' own `featured` ranks. */
import { parse } from 'yaml';
import type { Locale } from '../i18n/locale.ts';
import { type Case, type FolioYaml as FolioYamlType, FolioYaml, type Img, type Project, type ProjectEntry, type ProjectTranslation } from './schema.ts';
import { DOMAIN_SLUG } from './site.ts';

export type RepoData = {
  name: string; isPrivate: boolean; description: string | null; homepageUrl: string | null; pushedAt: string; createdAt: string;
  stargazerCount: number; primaryLanguage: string | null; openGraphImageUrl: string | null; usesCustomOpenGraphImage: boolean;
  topics: string[]; folioYaml: string | null;
};
export type Snapshot = { fetchedAt: string; source: 'live' | 'fixture'; owner: string; repos: RepoData[]; pins: string[] };
export type ManualProject = { id: string; en: ProjectEntry; tr?: ProjectTranslation };
export type App = { kind: 'play' | 'lab'; id: string; repo: RepoData; yaml: FolioYamlType };

/** A shown project, before choosing a language. */
export type Listing = {
  id: string; en: ProjectEntry; tr?: ProjectTranslation; yaml?: FolioYamlType;
  /** Social preview to download and optimise at build, when Folio has no image of its own. */
  remoteImage?: string; pushedAt?: string;
};
export type Discovery = { projects: Listing[]; featured: string[]; selected: string[]; apps: App[]; warnings: string[] };

export const MAX_FEATURED = 6;
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
const month = (iso: string, locale: Locale) => new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso)).replace('.', '');

function readYaml(repo: RepoData, warnings: string[]): FolioYamlType | null {
  if (!repo.folioYaml) return {};
  try {
    const result = FolioYaml.safeParse(parse(repo.folioYaml) ?? {});
    if (result.success) return result.data;
    warnings.push(`${repo.name}: .github/folio.yaml left out: ${result.error.issues.map((i) => `${i.path.join('.') || '(root)'} ${i.message}`).join('; ')}`);
  } catch (e) {
    warnings.push(`${repo.name}: .github/folio.yaml is not valid YAML: ${(e as Error).message.split('\n')[0]}`);
  }
  return null;
}

export function discover(snapshot: Snapshot, manual: ManualProject[], self: string): Discovery {
  const warnings: string[] = [];
  const repos = snapshot.repos.filter((r) => !r.isPrivate && r.name.toLowerCase() !== self.toLowerCase());
  const byName = new Map(repos.map((r) => [r.name.toLowerCase(), r]));
  const apps: App[] = [];
  const projects: Listing[] = [];
  const claimed = new Set<string>();

  for (const m of manual) {
    const repo = m.en.repo ? byName.get(m.en.repo.toLowerCase()) : undefined;
    if (m.en.repo) claimed.add(m.en.repo.toLowerCase());
    if (m.en.repo && !repo) continue; // private, renamed or deleted: its page goes
    if (!(m.en.listed || repo?.topics.includes('folio'))) continue;
    if (!repo) { projects.push({ id: m.id, en: m.en, tr: m.tr }); continue; }
    const yaml = readYaml(repo, warnings);
    if (!yaml) continue;
    projects.push({
      id: m.id, tr: m.tr, yaml, pushedAt: repo.pushedAt,
      en: { ...m.en, stars: repo.stargazerCount, date: repo.pushedAt.slice(0, 10), lang: repo.primaryLanguage ?? m.en.lang, ...(m.en.home || !repo.homepageUrl ? {} : { home: repo.homepageUrl }) },
    });
  }

  const ids = new Set(projects.map((p) => p.id));
  for (const repo of repos) {
    if (claimed.has(repo.name.toLowerCase())) continue;
    const kind = repo.topics.includes('folio-play') ? 'play' : repo.topics.includes('folio-lab') ? 'lab' : repo.topics.includes('folio') ? 'project' : null;
    if (!kind) continue;
    const yaml = readYaml(repo, warnings);
    if (!yaml) continue;
    const id = slug(repo.name);
    if (kind !== 'project') { apps.push({ kind, id, repo, yaml }); continue; }
    if (ids.has(id)) { warnings.push(`${repo.name}: left out, its address /projects/${id} is taken`); continue; }
    ids.add(id);
    projects.push({
      id, yaml, pushedAt: repo.pushedAt, remoteImage: repo.openGraphImageUrl ?? undefined,
      en: {
        name: yaml.title?.en ?? repo.name, repo: repo.name, lang: repo.primaryLanguage ?? '', date: repo.pushedAt.slice(0, 10),
        since: month(repo.createdAt, 'en'), stars: repo.stargazerCount, kind: 'img', ...(repo.homepageUrl ? { home: repo.homepageUrl } : {}),
        desc: yaml.summary?.en ?? repo.description ?? '', topics: repo.topics.filter((t) => !t.startsWith('folio')).slice(0, 4),
        area: yaml.area ?? DOMAIN_SLUG[0], listed: false,
      },
      tr: { name: yaml.title?.tr, desc: yaml.summary?.tr, since: month(repo.createdAt, 'tr') },
    });
  }

  const rank = (p: Listing) => p.en.order ?? p.yaml?.order;
  projects.sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    if (ra !== undefined || rb !== undefined) return ra === undefined ? 1 : rb === undefined ? -1 : ra - rb;
    return (b.pushedAt ?? b.en.date).localeCompare(a.pushedAt ?? a.en.date);
  });

  const shown = new Map(projects.map((p) => [p.en.repo?.toLowerCase(), p]));
  const pinned = snapshot.pins
    .map((name) => byName.get(name.toLowerCase()))
    .filter((r): r is RepoData => !!r && r.topics.includes('folio') && shown.has(r.name.toLowerCase()))
    .map((r) => shown.get(r.name.toLowerCase())!.id)
    .slice(0, MAX_FEATURED);
  const ranked = (key: 'featured' | 'selected') => projects.filter((p) => p.en[key] !== undefined).sort((a, b) => a.en[key]! - b.en[key]!).map((p) => p.id);

  return { projects, featured: pinned.length ? pinned : ranked('featured').slice(0, MAX_FEATURED), selected: ranked('selected'), apps, warnings };
}

/** A listing in one language: Turkish lays its translated fields over the English, and falls back to it. */
export function localize(listing: Listing, locale: Locale, image?: Img): { project: Project; study?: Case; translated: boolean } {
  const { area, listed: _l, order: _o, featured: _f, selected: _s, case: enCase, name, repo, ...rest } = listing.en;
  const tr = locale === 'tr' ? listing.tr : undefined;
  const pick = <T>(value: T | undefined, fallback: T) => (value === undefined ? fallback : value);
  // Same key order as before the static rebuild, so islands receive identical props.
  const project: Project = {
    id: listing.id, name: pick(tr?.name, name), ...(repo === undefined ? {} : { repo }), d: Math.max(0, DOMAIN_SLUG.indexOf(area)),
    ...rest, since: pick(tr?.since, rest.since), desc: pick(tr?.desc, rest.desc),
    ...(image ? { img: image, hero: rest.hero ?? image } : {}),
  };
  return { project, study: pick(tr?.case, enCase), translated: locale === 'en' || !!tr };
}
