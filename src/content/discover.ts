/* Which projects, games and lab apps the site shows, from the GitHub snapshot of this build and the projects written
   in Folio. Pure: no network, no files, so every rule below is unit-tested. Relative imports only (Node loads it).

   - Every public repository of the owner is a project, with no topic or file needed; never a private one, never
     Folio's own. A repository that goes private or is deleted takes its page with it at the next build.
   - Each is classified: the profile repository (named after the owner), templates, forks, and the repositories of
     games and lab apps in the controller's catalog; the rest are projects.
   - A project written in Folio (src/content/projects/<id>) is linked to its repository by `repoId`, which survives
     renames, or else by `repo` (the name). Its text, images and case study win over GitHub's; GitHub's stars, last
     push, languages and current name win over Folio's. Without a repository it is a project that isn't on GitHub.
   - A repository is shown once. One without a Folio entry gets an address from its name; if that address is taken,
     the older repository keeps it and the newer one gets `-2`, `-3`, with a warning. It shows the repository's own
     social preview only if one was uploaded (GitHub's generated card is not a project image).
   - Order: entries with an `order` first; then projects, games and lab apps by last push, newest first; then
     templates; the profile repository last.
   - The home page follows the profile pins: the first three pinned projects lead the hero, the next three are the
     selected work. Fewer pins mean fewer, never repeated or invented, cards.
   - Activity (/now): the latest commit on the default branch of each public repository, newest first.
   - Games and lab apps come from the Folio controller's catalog (snapshot.apps): it lists an app once its build is
     checked and kept, and drops it when its repository goes. An entry that doesn't fit the catalog schema is left out,
     with a warning (the GitHub step has already dropped any whose build didn't match its hash). This site serves each
     one itself at /<kind>/<id>/app/, so Folio frames only its own origin.
*/
import type { Locale } from '../i18n/locale.ts';
import { type Case, CatalogApp, type Img, type Project, type ProjectEntry, type ProjectTranslation, type RepoKind } from './schema.ts';
import { DOMAIN_SLUG } from './site.ts';

export type RepoData = {
  id: number; name: string; isPrivate: boolean; isTemplate: boolean; isFork: boolean; isArchived: boolean;
  description: string | null; homepageUrl: string | null; pushedAt: string; createdAt: string; stargazerCount: number;
  primaryLanguage: string | null; languages: string[]; openGraphImageUrl: string | null; usesCustomOpenGraphImage: boolean;
  topics: string[]; lastCommit: { message: string; date: string; url: string } | null;
};
export type Snapshot = { fetchedAt: string; source: 'live' | 'fixture'; owner: string; repos: RepoData[]; pins: string[]; apps?: unknown[] };
export type ManualProject = { id: string; en: ProjectEntry; tr?: ProjectTranslation };
export type App = CatalogApp;

/** A shown project, before choosing a language. */
export type Listing = {
  id: string; en: ProjectEntry; tr?: ProjectTranslation; type: RepoKind; langs: string[]; archived: boolean;
  /** The game's or lab app's own page in Folio, when the repository is one. */
  app?: string;
  /** The repository's own uploaded social preview, downloaded and optimised at build, when Folio has no image. */
  remoteImage?: string; pushedAt?: string;
};
export type Activity = { repo: string; project?: string; message: string; date: string; url: string };
export type Discovery = { projects: Listing[]; hero: string[]; selected: string[]; apps: App[]; activity: Activity[]; warnings: string[] };

export const HERO = 3;
export const SELECTED = 3;
const ACTIVITY = 8;
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '');
const month = (iso: string, locale: Locale) => new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso)).replace('.', '');
const repoName = (url: string | null) => url?.split('/').pop()?.toLowerCase();
const LAST: Partial<Record<RepoKind, number>> = { template: 1, profile: 2 };

export function discover(snapshot: Snapshot, manual: ManualProject[], self: string): Discovery {
  const warnings: string[] = [];
  const repos = snapshot.repos.filter((r) => !r.isPrivate && r.name.toLowerCase() !== self.toLowerCase());
  const byId = new Map(repos.map((r) => [r.id, r]));
  const byName = new Map(repos.map((r) => [r.name.toLowerCase(), r]));

  const apps: App[] = [];
  for (const raw of snapshot.apps ?? []) {
    const entry = CatalogApp.safeParse(raw);
    if (!entry.success) { warnings.push(`catalog: an app left out: ${entry.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`); continue; }
    if (apps.some((a) => a.kind === entry.data.kind && a.id === entry.data.id)) { warnings.push(`catalog: ${entry.data.id} listed twice`); continue; }
    apps.push(entry.data);
  }
  const appOf = new Map(apps.filter((a) => a.repo).map((a) => [repoName(a.repo)!, a]));
  const typeOf = (r: RepoData): RepoKind => {
    const app = appOf.get(r.name.toLowerCase());
    if (r.name.toLowerCase() === snapshot.owner.toLowerCase()) return 'profile';
    if (r.isTemplate) return 'template';
    if (app) return app.kind === 'play' ? 'game' : 'lab';
    return r.isFork ? 'fork' : 'project';
  };
  const extra = (r: RepoData) => {
    const app = appOf.get(r.name.toLowerCase());
    return { type: typeOf(r), langs: r.languages, archived: r.isArchived, pushedAt: r.pushedAt, ...(app ? { app: `/${app.kind}/${app.id}` } : {}) };
  };

  const projects: Listing[] = [];
  const taken = new Set<string>();
  const claimed = new Set<number>();
  for (const m of manual) {
    const linked = m.en.repoId !== undefined || m.en.repo !== undefined;
    const repo = (m.en.repoId !== undefined ? byId.get(m.en.repoId) : undefined) ?? (m.en.repo ? byName.get(m.en.repo.toLowerCase()) : undefined);
    if (linked && !repo) continue; // private or deleted: its page goes
    taken.add(m.id);
    if (!repo) { projects.push({ id: m.id, en: m.en, tr: m.tr, type: 'project', langs: [m.en.lang], archived: false }); continue; }
    if (claimed.has(repo.id)) { warnings.push(`${m.id}: ${repo.name} already has a Folio entry; this one is left out`); taken.delete(m.id); continue; }
    claimed.add(repo.id);
    projects.push({
      id: m.id, tr: m.tr, ...extra(repo),
      en: { ...m.en, repo: repo.name, stars: repo.stargazerCount, date: repo.pushedAt.slice(0, 10), lang: repo.primaryLanguage ?? m.en.lang, ...(m.en.home || !repo.homepageUrl ? {} : { home: repo.homepageUrl }) },
    });
  }

  // Oldest first, so an address taken twice stays with the repository that had it first.
  for (const repo of [...repos].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id)) {
    if (claimed.has(repo.id)) continue;
    const base = slug(repo.name) || `repo-${repo.id}`;
    let id = base;
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
    if (id !== base) warnings.push(`${repo.name}: /projects/${base} is taken, so it is at /projects/${id}`);
    taken.add(id);
    projects.push({
      id, ...extra(repo), ...(repo.usesCustomOpenGraphImage && repo.openGraphImageUrl ? { remoteImage: repo.openGraphImageUrl } : {}),
      en: {
        name: repo.name, repo: repo.name, repoId: repo.id, lang: repo.primaryLanguage ?? '', date: repo.pushedAt.slice(0, 10),
        since: month(repo.createdAt, 'en'), stars: repo.stargazerCount, kind: 'img', ...(repo.homepageUrl ? { home: repo.homepageUrl } : {}),
        desc: repo.description ?? '', topics: repo.topics.slice(0, 8), area: 'other',
      },
      tr: { since: month(repo.createdAt, 'tr') },
    });
  }

  const order = (a: Listing, b: Listing) => {
    const ra = a.en.order, rb = b.en.order;
    if (ra !== undefined || rb !== undefined) return ra === undefined ? 1 : rb === undefined ? -1 : ra - rb;
    return (LAST[a.type] ?? 0) - (LAST[b.type] ?? 0) || (b.pushedAt ?? b.en.date).localeCompare(a.pushedAt ?? a.en.date);
  };
  projects.sort(order);
  apps.sort((a, b) => (a.order !== undefined || b.order !== undefined ? (a.order === undefined ? 1 : b.order === undefined ? -1 : a.order - b.order) : b.updated.localeCompare(a.updated)));

  const byRepo = new Map(projects.filter((p) => p.en.repo).map((p) => [p.en.repo!.toLowerCase(), p.id]));
  const pinned = [...new Set(snapshot.pins.map((name) => byRepo.get(name.toLowerCase())).filter((id): id is string => !!id))];

  const activity = repos.filter((r) => r.lastCommit).sort((a, b) => b.lastCommit!.date.localeCompare(a.lastCommit!.date)).slice(0, ACTIVITY)
    .map((r): Activity => ({ repo: r.name, project: byRepo.get(r.name.toLowerCase()), ...r.lastCommit! }));

  return { projects, hero: pinned.slice(0, HERO), selected: pinned.slice(HERO, HERO + SELECTED), apps, activity, warnings };
}

/** A listing in one language: Turkish lays its translated fields over the English, and falls back to it.
    `translated` is true only when the Turkish text really exists: a description, and the case study if there is one. */
export function localize(listing: Listing, locale: Locale, image?: Img): { project: Project; study?: Case; translated: boolean } {
  const { area, order: _o, repoId: _r, case: enCase, name, repo, ...rest } = listing.en;
  const tr = locale === 'tr' ? listing.tr : undefined;
  const pick = <T>(value: T | undefined, fallback: T) => (value === undefined ? fallback : value);
  const project: Project = {
    id: listing.id, name: pick(tr?.name, name), ...(repo === undefined ? {} : { repo }), d: Math.max(0, DOMAIN_SLUG.indexOf(area)),
    ...rest, since: pick(tr?.since, rest.since), desc: pick(tr?.desc, rest.desc),
    ...(image ? { img: image, hero: rest.hero ?? image } : {}),
    type: listing.type, written: enCase !== undefined, langs: listing.langs, archived: listing.archived, ...(listing.app ? { app: listing.app } : {}),
  };
  const translated = locale === 'en' || (!!rest.desc && tr?.desc !== undefined && (enCase === undefined || tr.case !== undefined)) || (!rest.desc && enCase === undefined);
  return { project, study: pick(tr?.case, enCase), translated };
}
