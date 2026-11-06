/* Shapes of everything the content store holds, one schema per entry. Every write is checked against these,
   and published bodies are checked again when read, so a page never renders data it doesn't expect.
   Relative imports only: the seed tool and the unit tests load this file in Node. */
import { z } from 'astro/zod';

export const SCHEMA_VERSION = 1;

type Words<S extends string> = S extends `${infer Head} ${infer Tail}` ? Head | Words<Tail> : S;
/** Plain text fields, named in one string: text('title note') */
const text = <S extends string>(keys: S) => Object.fromEntries(keys.split(' ').map((k) => [k, z.string()])) as { [K in Words<S>]: z.ZodString };
const pair = z.tuple([z.string(), z.string()]);
const color = z.string().regex(/^#[0-9a-f]{6}$/i);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const Img = z.object({ src: z.string().startsWith('/assets/'), w: z.number().int().positive(), h: z.number().int().positive() }).strict();

export const CaseSection = z.object({
  kind: z.literal('overview').optional(),
  title: z.string(),
  paras: z.array(z.string()).optional(),
  list: z.array(pair).optional(),
  gal: z.array(z.tuple([Img, z.string()])).optional(),
  todo: z.boolean().optional(),
}).strict();
export const Case = z.object({ lede: z.string(), stack: z.string(), facts: z.array(pair).optional(), sections: z.array(CaseSection) }).strict();

/* A project's English body holds every field; the Turkish one only what is translated, laid over the English. */
const ProjectFields = z.object({
  name: z.string(), repo: z.string(), d: z.number().int().min(0).max(4), lang: z.string(), date: day, since: z.string(),
  stars: z.number().int().min(0), kind: z.enum(['img', 'browser', 'pixel']), tint: z.tuple([color, color]).optional(),
  img: Img.optional(), hero: Img.optional(), pos: z.string().optional(), contain: z.boolean().optional(),
  home: z.url().optional(), desc: z.string(), topics: z.array(z.string()),
}).strict();
export const ProjectBody = ProjectFields.extend({ case: Case.optional() }).strict();
export const ProjectTranslation = z.object({ desc: z.string().optional(), since: z.string().optional(), case: Case.optional() }).strict();

/* Page copy, one entry per key. */
export const PageBodies = {
  toWrite: z.string(),
  stage: z.object({
    planets: z.object(text('Mercury Venus Earth Mars Jupiter Saturn Uranus Neptune')).strict(),
    ...text('orbit days oneYear years orreryLabel site wallpaper injected chooseWall wallItem vars'),
  }).strict(),
  mochi: z.object({ ...text('label shortLabel poke pet'), moods: z.object(text('idle waking poked petted love happy dizzy sleep')).strict() }).strict(),
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
  lab: z.object({ ...text('title label kicker lede canvas controls drop surface pause resume notebook now nextLabel rule nowText nextText ruleText foot planH planned'), plan: z.array(pair) }).strict(),
  play: z.object({ ...text('title label status h1 note canvas shake pause resume tape rulesH'), rules: z.array(pair) }).strict(),
  about: z.object({
    ...text('title eyebrow h1a h1em h1b lede draft portraitLabel portraitDraft patternsH path pathH pathNote formal formalLead formalTail readCv uses now next totals repos languages stars'),
    patterns: z.array(z.tuple([z.string(), z.string(), z.string()])),
    timeline: z.array(z.tuple([z.string(), z.string(), z.string(), z.string()])),
  }).strict(),
  uses: z.object({ ...text('title eyebrow note'), h1: pair, groups: z.array(z.tuple([z.string(), z.array(pair)])) }).strict(),
  now: z.object({ ...text('title eyebrow h1 focus draft pushes'), updated: day }).strict(),
  secret: z.object(text('title h1 note letter open')).strict(),
};

export const CvBody = z.object({
  text: z.object(text('heading note dates copyText copied pdf sheetLabel role loc profile summary experience intern internPh projects education degree grad skills skillsLine languages langLine level')).strict(),
  projects: z.array(z.tuple([z.string(), z.string(), z.string()])),
}).strict();

export type Img = z.infer<typeof Img>;
export type CaseSection = z.infer<typeof CaseSection>;
export type Case = z.infer<typeof Case>;
export type Kind = z.infer<typeof ProjectFields>['kind'];
export type Project = z.infer<typeof ProjectFields> & { id: string };
export type Pages = { [K in keyof typeof PageBodies]: z.infer<(typeof PageBodies)[K]> };
export type Cv = z.infer<typeof CvBody>;

export type PageSlug = keyof typeof PageBodies;
export const PAGE_SLUGS = Object.keys(PageBodies) as PageSlug[];
/* Pages kept out of menus, search and sitemaps, reachable by their address only. */
export const UNLISTED_PAGES: PageSlug[] = ['uses', 'now', 'secret'];

/** The schema a body must satisfy, by entry and language. */
export function schemaFor(type: string, slug: string, locale: string) {
  if (type === 'page' && slug in PageBodies) return PageBodies[slug as PageSlug];
  if (type === 'project') return locale === 'en' ? ProjectBody : ProjectTranslation;
  if (type === 'cv' && slug === 'cv') return CvBody;
  throw new Error(`no schema for ${type}/${slug}`);
}
