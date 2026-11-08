/* Shapes of the content in src/content/ and of the controller's catalog. Folio's own files are checked at build and
   an error stops it; a catalog entry that doesn't fit only drops that app.
   Relative imports only: the GitHub step and the unit tests load this file in Node. */
import { z } from 'astro/zod';
import { DOMAIN_SLUG } from './site.ts';

type Words<S extends string> = S extends `${infer Head} ${infer Tail}` ? Head | Words<Tail> : S;
/** Plain text fields, named in one string: text('title note') */
const text = <S extends string>(keys: S) => Object.fromEntries(keys.split(' ').map((k) => [k, z.string()])) as { [K in Words<S>]: z.ZodString };
const pair = z.tuple([z.string(), z.string()]);
const color = z.string().regex(/^#[0-9a-f]{6}$/i);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const visibility = { visibility: z.enum(['public', 'unlisted']).default('public') };

export const Img = z.object({ src: z.string().startsWith('/'), w: z.number().int().positive(), h: z.number().int().positive() }).strict();

export const CaseSection = z.object({
  kind: z.literal('overview').optional(),
  title: z.string(),
  paras: z.array(z.string()).optional(),
  list: z.array(pair).optional(),
  gal: z.array(z.tuple([Img, z.string()])).optional(),
}).strict();
export const Case = z.object({ lede: z.string(), stack: z.string(), facts: z.array(pair).optional(), sections: z.array(CaseSection) }).strict();

/* What a project card and page show. */
const ProjectFields = z.object({
  name: z.string(), repo: z.string().optional(), lang: z.string(), date: day, since: z.string(),
  stars: z.number().int().min(0), kind: z.enum(['img', 'browser', 'pixel']), tint: z.tuple([color, color]).optional(),
  img: Img.optional(), hero: Img.optional(), pos: z.string().optional(), contain: z.boolean().optional(),
  home: z.url().optional(), desc: z.string(), topics: z.array(z.string()),
}).strict();

/* A project written in Folio (src/content/projects/<id>/en.md). `repoId` (the repository's numeric id, which
   survives renames) or `repo` (its name) links it to its GitHub repository; without either it is a project that
   isn't on GitHub. `order` puts it ahead of the projects sorted by last push. */
export const ProjectEntry = ProjectFields.extend({
  area: z.enum(DOMAIN_SLUG as [string, ...string[]]),
  repoId: z.number().int().positive().optional(),
  order: z.number().int().optional(),
  case: Case.optional(),
}).strict();
/* Turkish only holds what is translated, laid over the English. */
export const ProjectTranslation = z.object({ name: z.string().optional(), desc: z.string().optional(), since: z.string().optional(), case: Case.optional() }).strict();

/* A game or lab app as the Folio controller lists it (catalog.json). Its checked files are fetched at build by their
   hash and served by this site at /<kind>/<id>/app/. */
const INPUTS = ['keyboard', 'touch', 'mouse', 'gamepad'] as const;
export const CatalogApp = z.object({
  kind: z.enum(['play', 'lab']),
  id: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/),
  title: z.object({ en: z.string().min(1), tr: z.string().optional() }).strict(),
  summary: z.object({ en: z.string(), tr: z.string().optional() }).strict(),
  order: z.number().int().optional(),
  embed: z.boolean(),
  aspect: z.string().regex(/^\d+:\d+$/),
  inputs: z.array(z.enum(INPUTS)),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  repo: z.url().nullable(),
  language: z.string().nullable(),
  stars: z.number().int().min(0),
  build: z.object({ sha256: z.string().regex(/^[0-9a-f]{64}$/), size: z.number().int().positive() }).strict(),
}).strict();
export type CatalogApp = z.infer<typeof CatalogApp>;

/* Page copy, one entry per group (src/content/pages/<group>/{en,tr}.md). */
export const PageBodies = {
  shared: z.object({
    stage: z.object({
      planets: z.object(text('Mercury Venus Earth Mars Jupiter Saturn Uranus Neptune')).strict(),
      ...text('orbit days oneYear years orreryLabel site wallpaper injected chooseWall wallItem vars'),
    }).strict(),
    mochi: z.object({ ...text('label shortLabel poke pet'), moods: z.object(text('idle waking poked petted love happy dizzy sleep')).strict() }).strict(),
  }).strict(),
  home: z.object({
    ...text('heroLabel eyebrow line1 line2 lede allProjects about featured prev next pause play selectedNote allShort approach approachLabel lead tail moreLabel more morePages labStatus labTeaser playStatus playTeaser'),
    hints: z.record(z.string(), z.string()), selected: pair,
  }).strict(),
  projects: z.object({
    ...text('title eyebrow note totals repos languages stars all filter view gallery galleryView index indexView count countOne countIn empty no project area language lastPush starsHead'),
    lines: pair,
  }).strict(),
  case: z.object({
    ...text('projects breadcrumb previous next live repo specs language area started stars noStars topics about noWriteUp noDesc englishOnly languages lastPush type archived openApp screensGroup show enlarge enlargeScreen enlarged screenshot nextProject readNext allProjects'),
    screens: pair, types: z.object(text('project profile template fork game lab')).strict(),
  }).strict(),
  lab: z.object({ ...text('title label kicker lede empty catalogH catalogNote canvas controls drop surface pause resume notebook now nextLabel rule nowText nextText ruleText foot planH planned'), plan: z.array(pair) }).strict(),
  play: z.object({ ...text('title label status h1 note empty catalogH catalogNote canvas shake pause resume rulesH'), rules: z.array(pair) }).strict(),
  apps: z.object(text('breadcrumb play lab start newTab repo fullscreen exitFullscreen loading slow noEmbed frameLabel hostNote inputs language updated stars noStars englishOnly')).strict(),
  about: z.object({
    ...text('title eyebrow h1a h1em h1b lede portrait patternsH path pathH pathNote formal formalLead formalTail readCv now next totals repos languages stars'),
    patterns: z.array(z.tuple([z.string(), z.string(), z.string()])),
    timeline: z.array(z.tuple([z.string(), z.string(), z.string(), z.string()])),
  }).strict(),
  now: z.object({ ...visibility, ...text('title eyebrow h1 lede commits synced empty') }).strict(),
  secret: z.object({ ...visibility, ...text('title h1 note word letter open') }).strict(),
  privacy: z.object({ ...text('title eyebrow h1 lede updated'), sections: z.array(pair) }).strict(),
};
export type PageGroup = keyof typeof PageBodies;
export const PAGE_GROUPS = Object.keys(PageBodies) as PageGroup[];

type Group<K extends PageGroup> = z.infer<(typeof PageBodies)[K]>;
export type Img = z.infer<typeof Img>;
export type CaseSection = z.infer<typeof CaseSection>;
export type Case = z.infer<typeof Case>;
export type Kind = z.infer<typeof ProjectFields>['kind'];
/** What a repository is: the profile README, a template, a fork, a game or lab app in the catalog, or a project. */
export type RepoKind = 'project' | 'profile' | 'template' | 'fork' | 'game' | 'lab';
export type Project = z.infer<typeof ProjectFields> & {
  id: string; d: number; type: RepoKind;
  /** Whether Folio has a written case study for it. */
  written: boolean;
  langs: string[]; archived: boolean;
  /** The game's or lab app's page in Folio. */
  app?: string;
};
export type ProjectEntry = z.infer<typeof ProjectEntry>;
export type ProjectTranslation = z.infer<typeof ProjectTranslation>;
/* What pages receive: the shared group spread at the top, as the components expect. */
export type Pages = Group<'shared'> & { [K in Exclude<PageGroup, 'shared'>]: Group<K> };
