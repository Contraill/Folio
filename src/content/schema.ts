/* Shapes of the content in src/content/ and of `.github/folio.yaml` in project repositories. Folio's own files
   are checked at build and an error stops it; a repository's folio.yaml that doesn't fit only drops that card.
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
  todo: z.boolean().optional(),
}).strict();
export const Case = z.object({ lede: z.string(), stack: z.string(), facts: z.array(pair).optional(), sections: z.array(CaseSection) }).strict();

/* What a project card and page show. */
const ProjectFields = z.object({
  name: z.string(), repo: z.string().optional(), lang: z.string(), date: day, since: z.string(),
  stars: z.number().int().min(0), kind: z.enum(['img', 'browser', 'pixel']), tint: z.tuple([color, color]).optional(),
  img: Img.optional(), hero: Img.optional(), pos: z.string().optional(), contain: z.boolean().optional(),
  home: z.url().optional(), desc: z.string(), topics: z.array(z.string()),
}).strict();

/* A project written in Folio (src/content/projects/<id>/en.md). `repo` links it to its GitHub repository; without
   one it is a project that isn't on GitHub. `listed` shows it even before its repository has the `folio` topic. */
export const ProjectEntry = ProjectFields.extend({
  area: z.enum(DOMAIN_SLUG as [string, ...string[]]),
  listed: z.boolean().default(false),
  order: z.number().int().optional(),
  featured: z.number().int().optional(),
  selected: z.number().int().optional(),
  case: Case.optional(),
}).strict();
/* Turkish only holds what is translated, laid over the English. */
export const ProjectTranslation = z.object({ name: z.string().optional(), desc: z.string().optional(), since: z.string().optional(), case: Case.optional() }).strict();

/* `.github/folio.yaml` in a project, game or lab repository. English text comes from the repository itself. */
const Localized = z.object({ en: z.string().optional(), tr: z.string().optional() }).strict();
export const FolioYaml = z.object({
  title: Localized.optional(),
  summary: Localized.optional(),
  order: z.number().int().optional(),
  area: z.enum(DOMAIN_SLUG as [string, ...string[]]).optional(),
}).strict();

/* A game or lab app as the Folio controller lists it after deploying it (catalog.json): only apps that are public. */
const INPUTS = ['keyboard', 'touch', 'mouse', 'gamepad'] as const;
export const CatalogApp = z.object({
  kind: z.enum(['play', 'lab']),
  id: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/),
  url: z.url({ protocol: /^https$/ }),
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
}).strict();
export type CatalogApp = z.infer<typeof CatalogApp>;

/* Page copy, one entry per group (src/content/pages/<group>/{en,tr}.md). */
export const PageBodies = {
  shared: z.object({
    toWrite: z.string(),
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
    ...text('projects breadcrumb previous next live repo specs language area started stars noStars topics lesson fromReadme about noWriteUp screensGroup show enlarge enlargeScreen enlarged screenshot nextProject readNext allProjects'),
    screens: pair,
  }).strict(),
  lab: z.object({ ...text('title label kicker lede kickerReady ledeReady catalogH catalogNote canvas controls drop surface pause resume notebook now nextLabel rule nowText nextText ruleText foot planH planned'), plan: z.array(pair) }).strict(),
  play: z.object({ ...text('title label status h1 note statusReady h1Ready noteReady catalogH catalogNote canvas shake pause resume tape rulesH'), rules: z.array(pair) }).strict(),
  apps: z.object(text('breadcrumb play lab start newTab repo fullscreen exitFullscreen loading slow noEmbed frameLabel hostNote inputs language updated stars noStars')).strict(),
  about: z.object({
    ...text('title eyebrow h1a h1em h1b lede draft portraitLabel portraitDraft patternsH path pathH pathNote formal formalLead formalTail readCv uses now next totals repos languages stars'),
    patterns: z.array(z.tuple([z.string(), z.string(), z.string()])),
    timeline: z.array(z.tuple([z.string(), z.string(), z.string(), z.string()])),
  }).strict(),
  uses: z.object({ ...visibility, ...text('title eyebrow note'), h1: pair, groups: z.array(z.tuple([z.string(), z.array(pair)])) }).strict(),
  now: z.object({ ...visibility, ...text('title eyebrow h1 focus draft pushes'), updated: day }).strict(),
  secret: z.object({ ...visibility, ...text('title h1 note letter open') }).strict(),
};
export type PageGroup = keyof typeof PageBodies;
export const PAGE_GROUPS = Object.keys(PageBodies) as PageGroup[];

type Group<K extends PageGroup> = z.infer<(typeof PageBodies)[K]>;
export type Img = z.infer<typeof Img>;
export type CaseSection = z.infer<typeof CaseSection>;
export type Case = z.infer<typeof Case>;
export type Kind = z.infer<typeof ProjectFields>['kind'];
export type Project = Omit<z.infer<typeof ProjectFields>, never> & { id: string; d: number };
export type ProjectEntry = z.infer<typeof ProjectEntry>;
export type ProjectTranslation = z.infer<typeof ProjectTranslation>;
export type FolioYaml = z.infer<typeof FolioYaml>;
/* What pages receive: the shared group spread at the top, as the components expect. */
export type Pages = Group<'shared'> & { [K in Exclude<PageGroup, 'shared'>]: Group<K> };
