import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parse } from 'yaml';
import { appOrigins, discover, localize, type ManualProject, type RepoData, type Snapshot } from './discover.ts';
import { ProjectEntry, ProjectTranslation } from './schema.ts';

const recorded: Snapshot = JSON.parse(readFileSync(new URL('../../tests/fixtures/github.json', import.meta.url), 'utf8'));
const read = (path: string) => parse(/^---\n([\s\S]*?)\n---/.exec(readFileSync(new URL(path, import.meta.url), 'utf8'))![1]);
const ids = readdirSync(new URL('./projects/', import.meta.url));
const manual: ManualProject[] = ids.map((id) => ({ id, en: ProjectEntry.parse(read(`./projects/${id}/en.md`)), tr: ProjectTranslation.parse(read(`./projects/${id}/tr.md`)) }));
let nextId = 9000;
const repo = (name: string, extra: Partial<RepoData> = {}): RepoData => ({
  id: nextId++, name, isPrivate: false, isTemplate: false, isFork: false, isArchived: false, description: `${name} description`, homepageUrl: null,
  pushedAt: '2026-11-01T00:00:00Z', createdAt: '2026-01-15T00:00:00Z', stargazerCount: 3, primaryLanguage: 'Rust', languages: ['Rust', 'Shell'],
  openGraphImageUrl: `https://opengraph.githubassets.com/x/Contraill/${name}`, usesCustomOpenGraphImage: false, topics: [],
  lastCommit: { message: `${name}: work`, date: '2026-11-01T00:00:00Z', url: `https://github.com/Contraill/${name}/commit/1` }, ...extra,
});
const snap = (change: (s: Snapshot) => void = () => {}) => { const s: Snapshot = structuredClone(recorded); change(s); return s; };
const shown = (s: Snapshot) => discover(s, manual, 'Folio').projects.map((p) => p.id);
const find = (s: Snapshot, id: string) => discover(s, manual, 'Folio').projects.find((p) => p.id === id)!;

test('every public repository is a project, once, with no topic or file needed', () => {
  const d = discover(recorded, manual, 'Folio');
  assert.equal(d.projects.length, recorded.repos.length);
  assert.equal(new Set(d.projects.map((p) => p.en.repo)).size, d.projects.length, 'no repository twice');
  assert.deepEqual(d.warnings, []);
  // What Folio wrote wins over GitHub's description; GitHub's current numbers win over Folio's.
  const helios = d.projects.find((p) => p.id === 'helios')!;
  assert.ok(helios.en.case);
  assert.equal(helios.en.stars, recorded.repos.find((r) => r.name === 'Helios')!.stargazerCount);
});

test('private repositories and Folio itself are never discovered, whatever their pins', () => {
  const s = snap((s) => {
    s.repos.push(repo('secret-thing', { isPrivate: true, lastCommit: { message: 'private plans', date: '2030-01-01T00:00:00Z', url: 'x' } }), repo('Folio'));
    s.pins.unshift('secret-thing', 'Folio');
  });
  const d = discover(s, manual, 'Folio');
  const all = JSON.stringify(d);
  for (const word of ['secret-thing', 'private plans']) assert.ok(!all.includes(word), word);
  assert.ok(!d.projects.some((p) => p.id === 'folio'));
});

test('a repository that goes private or disappears takes its page with it', () => {
  assert.ok(!shown(snap((s) => { s.repos.find((r) => r.name === 'Orbis')!.isPrivate = true; })).includes('orbis'));
  assert.ok(!shown(snap((s) => { s.repos = s.repos.filter((r) => r.name !== 'CampusEats'); })).includes('campuseats'));
  assert.ok(!shown(snap((s) => { s.repos = s.repos.filter((r) => r.name !== 'Comet'); s.repos.push(repo('Comet', { isPrivate: true })); })).includes('comet'));
});

test('repositories are told apart: profile, templates, forks, games and lab apps', () => {
  const s = snap((s) => {
    s.repos.push(repo('Forked', { isFork: true }), repo('Snake'), repo('Spiral'));
    s.apps = [app('snake', { repo: 'https://github.com/Contraill/Snake' }), app('spiral', { kind: 'lab', repo: 'https://github.com/Contraill/Spiral' })];
  });
  const type = (id: string) => find(s, id).type;
  assert.equal(type('contraill'), 'profile');
  assert.equal(type('folio-site-template'), 'template');
  assert.equal(type('forked'), 'fork');
  assert.equal(type('snake'), 'game');
  assert.equal(find(s, 'snake').app, '/play/snake');
  assert.equal(type('spiral'), 'lab');
  assert.equal(type('helios'), 'project');
});

test('a written project survives a rename: linked by id, its address stays', () => {
  const s = snap((s) => { s.repos.find((r) => r.name === 'Helios')!.name = 'Helios-3D'; });
  const helios = find(s, 'helios');
  assert.equal(helios.en.repo, 'Helios-3D', 'links follow the new name');
  assert.ok(!shown(s).includes('helios-3d'), 'no second page under the new name');
});

test('a repository Folio has nothing written about gets a complete page from GitHub alone', () => {
  const s = snap((s) => s.repos.push(repo('Comet', { homepageUrl: 'https://comet.example.dev', topics: ['astro', 'space'] })));
  const comet = find(s, 'comet');
  assert.equal(comet.en.desc, 'Comet description');
  assert.equal(comet.en.area, 'other', 'no area is guessed');
  assert.equal(comet.en.home, 'https://comet.example.dev');
  assert.deepEqual(comet.en.topics, ['astro', 'space']);
  assert.equal(comet.remoteImage, undefined, "GitHub's generated card is not a project image");
  const own = find(snap((s) => s.repos.push(repo('Shot', { usesCustomOpenGraphImage: true }))), 'shot');
  assert.equal(own.remoteImage, 'https://opengraph.githubassets.com/x/Contraill/Shot');
  // Turkish keeps the English description and says it is English; an empty description has nothing to translate.
  assert.equal(localize(comet, 'tr').project.desc, 'Comet description');
  assert.equal(localize(comet, 'tr').translated, false);
  assert.equal(localize(comet, 'tr').project.since, 'Oca 2026');
  assert.equal(localize(find(snap((s) => s.repos.push(repo('Blank', { description: null }))), 'blank'), 'tr').translated, true);
});

test('a written project counts as translated only when its Turkish text exists', () => {
  const helios = find(recorded, 'helios');
  assert.equal(localize(helios, 'tr').translated, true);
  assert.equal(localize({ ...helios, tr: {} }, 'tr').translated, false, 'an empty Turkish entry is no translation');
  assert.equal(localize({ ...helios, tr: { desc: 'x' } }, 'tr').translated, false, 'the case study needs Turkish too');
  assert.equal(localize({ ...helios, tr: {} }, 'en').translated, true);
});

test('an address taken twice stays with the older repository; the newer one gets a suffix, with a warning', () => {
  const d = discover(snap((s) => s.repos.push(repo('Comet', { createdAt: '2025-01-01T00:00:00Z' }), repo('comet_', { createdAt: '2026-05-01T00:00:00Z' }), repo('MOCHI-'))), manual, 'Folio');
  assert.equal(d.projects.find((p) => p.id === 'comet')!.en.repo, 'Comet');
  assert.equal(d.projects.find((p) => p.id === 'comet-2')!.en.repo, 'comet_');
  assert.equal(d.projects.find((p) => p.id === 'mochi')!.en.repo, 'mochi', 'a written project keeps its address');
  assert.equal(d.projects.find((p) => p.id === 'mochi-2')!.en.repo, 'MOCHI-');
  assert.equal(d.warnings.length, 2);
  assert.match(d.warnings[0], /is taken/);
});

test('the home page follows the pins: three for the hero, the next three selected, never repeated or invented', () => {
  const d = discover(recorded, manual, 'Folio');
  assert.deepEqual(d.hero, ['helios', 'huepr', 'nothing']);
  assert.deepEqual(d.selected, ['orbis', 'campuseats', 'bct']);
  const fewer = discover(snap((s) => { s.pins = ['Orbis', 'orbis', 'gone-repo', 'mochi']; }), manual, 'Folio');
  assert.deepEqual(fewer.hero, ['orbis', 'mochi'], 'duplicates and unknown pins are dropped');
  assert.deepEqual(fewer.selected, []);
  const none = discover(snap((s) => { s.pins = []; }), manual, 'Folio');
  assert.deepEqual([none.hero, none.selected], [[], []]);
  const swapped = discover(snap((s) => { s.pins = [...s.pins.slice(3), ...s.pins.slice(0, 3)]; }), manual, 'Folio');
  assert.deepEqual(swapped.hero, ['orbis', 'campuseats', 'bct'], 'a new pin order moves both sections');
});

test('order: entries with an order first, then by last push; templates and the profile last', () => {
  const s = snap((s) => s.repos.push(repo('Old', { pushedAt: '2020-01-01T00:00:00Z' }), repo('New', { pushedAt: '2030-01-01T00:00:00Z' })));
  const all = shown(s);
  assert.equal(all.indexOf('new'), all.findIndex((id) => find(s, id).en.order === undefined));
  assert.ok(all.indexOf('old') < all.indexOf('folio-site-template'));
  assert.equal(all.at(-1), 'contraill');
});

test('activity is the latest commit of each public repository, newest first, at most eight', () => {
  const d = discover(snap((s) => s.repos.push(repo('Fresh', { lastCommit: { message: 'Fresh: start', date: '2030-01-01T00:00:00Z', url: 'https://github.com/Contraill/Fresh/commit/1' } }), repo('Quiet', { lastCommit: null }))), manual, 'Folio');
  assert.equal(d.activity.length, 8);
  assert.deepEqual(d.activity[0], { repo: 'Fresh', project: 'fresh', message: 'Fresh: start', date: '2030-01-01T00:00:00Z', url: 'https://github.com/Contraill/Fresh/commit/1' });
  assert.ok(d.activity.every((a, i) => i === 0 || a.date <= d.activity[i - 1].date));
  assert.ok(!d.activity.some((a) => a.repo === 'Quiet'));
});

const app = (id: string, extra: Record<string, unknown> = {}) => ({
  kind: 'play', id, url: `https://${id}.oztozlu.dev/`, title: { en: id }, summary: { en: '' }, embed: true, aspect: '16:9', inputs: [],
  updated: '2026-11-01', repo: null, language: null, stars: 0, ...extra,
});

test('games and lab apps come from the controller catalog, never from topics', () => {
  const d = discover(snap((s) => {
    s.repos.push(repo('Snake', { topics: ['folio-play'], homepageUrl: 'https://snake.example.dev/' }));
    s.apps = [app('gates'), app('spirals', { kind: 'lab' })];
  }), manual, 'Folio');
  assert.deepEqual(d.apps.map((a) => [a.kind, a.id]), [['play', 'gates'], ['lab', 'spirals']]);
  assert.equal(d.projects.find((p) => p.id === 'snake')!.type, 'project', 'a play topic alone makes no app');
});

test('catalog entries are checked and ordered: an order first, then the newest', () => {
  const d = discover(snap((s) => { s.apps = [
    app('old', { updated: '2026-01-01' }), app('new', { updated: '2026-11-05' }), app('first', { order: 1, updated: '2025-01-01' }),
    app('plain', { url: 'http://plain.oztozlu.dev/' }), app('Bad Id'), { kind: 'play' }, app('new'),
  ]; }), manual, 'Folio');
  assert.deepEqual(d.apps.map((a) => a.id), ['first', 'new', 'old']);
  assert.equal(d.warnings.length, 4);
});

test('Folio may frame only the origins of catalogued apps that allow embedding', () => {
  const s = snap((s) => { s.apps = [app('game', { url: 'https://game.oztozlu.dev/play/' }), app('link', { embed: false })]; });
  assert.deepEqual(appOrigins(s, 'Folio'), ['https://game.oztozlu.dev']);
  assert.deepEqual(appOrigins(recorded, 'Folio'), []);
});
