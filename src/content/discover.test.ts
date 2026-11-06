import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parse } from 'yaml';
import { discover, localize, type ManualProject, type RepoData, type Snapshot } from './discover.ts';
import { ProjectEntry, ProjectTranslation } from './schema.ts';

const recorded: Snapshot = JSON.parse(readFileSync(new URL('../../tests/fixtures/github.json', import.meta.url), 'utf8'));
const read = (path: string) => parse(/^---\n([\s\S]*?)\n---/.exec(readFileSync(new URL(path, import.meta.url), 'utf8'))![1]);
const ids = ['huepr', 'helios', 'nothing', 'orbis', 'campuseats', 'bct', 'mochi', 'nodesk', 'zen'];
const manual: ManualProject[] = ids.map((id) => ({ id, en: ProjectEntry.parse(read(`./projects/${id}/en.md`)), tr: ProjectTranslation.parse(read(`./projects/${id}/tr.md`)) }));
const repo = (name: string, extra: Partial<RepoData> = {}): RepoData => ({
  name, isPrivate: false, description: `${name} description`, homepageUrl: null, pushedAt: '2026-11-01T00:00:00Z', createdAt: '2026-01-15T00:00:00Z',
  stargazerCount: 3, primaryLanguage: 'Rust', openGraphImageUrl: `https://opengraph.githubassets.com/x/Contraill/${name}`, usesCustomOpenGraphImage: false,
  topics: ['folio'], folioYaml: null, ...extra,
});
const snap = (change: (s: Snapshot) => void = () => {}) => { const s: Snapshot = structuredClone(recorded); change(s); return s; };
const tag = (s: Snapshot, name: string, topic = 'folio') => s.repos.find((r) => r.name === name)!.topics.push(topic);
const shown = (s: Snapshot) => discover(s, manual, 'Folio').projects.map((p) => p.id);

test('before any repository has the folio topic, the listed Folio projects stay, in their order', () => {
  const d = discover(recorded, manual, 'Folio');
  assert.deepEqual(d.projects.map((p) => p.id), ['huepr', 'helios', 'nothing', 'orbis', 'campuseats', 'bct', 'mochi']);
  assert.deepEqual(d.featured, ['helios', 'huepr', 'mochi'], 'pins count only with the folio topic');
  assert.deepEqual(d.selected, ['orbis', 'campuseats', 'bct', 'nothing']);
  assert.deepEqual(d.warnings, []);
});

test('private repositories and Folio itself are never discovered, whatever their topics and pins', () => {
  const s = snap((s) => {
    s.repos.push(repo('secret-thing', { isPrivate: true }), repo('play-secret', { isPrivate: true, topics: ['folio-play'] }), repo('Folio'));
    s.pins.unshift('secret-thing', 'Folio');
  });
  const d = discover(s, manual, 'Folio');
  const all = JSON.stringify(d);
  for (const name of ['secret-thing', 'play-secret']) assert.ok(!all.includes(name), name);
  assert.ok(!d.projects.some((p) => p.id === 'folio'));
});

test('a repository that goes private or disappears takes its project with it', () => {
  assert.ok(!shown(snap((s) => { s.repos.find((r) => r.name === 'Orbis')!.isPrivate = true; })).includes('orbis'));
  assert.ok(!shown(snap((s) => { s.repos = s.repos.filter((r) => r.name !== 'CampusEats'); })).includes('campuseats'));
});

test('adding the folio topic to a candidate shows it once, with what Folio wrote about it', () => {
  const s = snap((s) => tag(s, 'Nodesk'));
  const d = discover(s, manual, 'Folio');
  assert.equal(d.projects.filter((p) => p.id === 'nodesk').length, 1);
  const nodesk = d.projects.find((p) => p.id === 'nodesk')!;
  assert.equal(nodesk.en.img?.src, '/assets/card_nodesk.webp');
  // Tagging an already listed project changes nothing either.
  assert.equal(shown(snap((s) => tag(s, 'huepr'))).filter((id) => id === 'huepr').length, 1);
});

test('a tagged repository Folio has no entry for becomes a project from its GitHub data', () => {
  const s = snap((s) => s.repos.push(repo('Comet', { folioYaml: 'summary: { tr: "Kuyruklu yıldız" }\norder: 99\n' })));
  const d = discover(s, manual, 'Folio');
  const comet = d.projects.find((p) => p.id === 'comet')!;
  assert.equal(comet.remoteImage, 'https://opengraph.githubassets.com/x/Contraill/Comet');
  assert.equal(localize(comet, 'en').project.desc, 'Comet description');
  assert.equal(localize(comet, 'tr').project.desc, 'Kuyruklu yıldız');
  assert.equal(localize(comet, 'tr').project.since, 'Oca 2026');
  // Without a Turkish summary, the English one is shown and the page says so.
  const plain = discover(snap((s) => s.repos.push(repo('Plain'))), manual, 'Folio').projects.find((p) => p.id === 'plain')!;
  assert.equal(localize(plain, 'tr').project.desc, 'Plain description');
});

test('a broken folio.yaml leaves out only that card, with a warning', () => {
  const d = discover(snap((s) => s.repos.push(repo('Broken', { folioYaml: 'order: "first"\nunknown: 1\n' }), repo('NotYaml', { folioYaml: 'a: [' }), repo('Fine'))), manual, 'Folio');
  assert.ok(!d.projects.some((p) => p.id === 'broken' || p.id === 'notyaml'));
  assert.ok(d.projects.some((p) => p.id === 'fine'));
  assert.equal(d.warnings.length, 2);
  assert.match(d.warnings[0], /^Broken: \.github\/folio\.yaml left out/);
});

test('featured are the pinned repositories with the folio topic, in pin order, at most six', () => {
  const s = snap((s) => {
    for (const name of ['huepr', 'Orbis', 'Nothing-Kde-Theme']) tag(s, name);
    s.pins = ['Orbis', 'Helios', 'huepr', 'Nothing-Kde-Theme'];
  });
  assert.deepEqual(discover(s, manual, 'Folio').featured, ['orbis', 'huepr', 'nothing'], 'Helios is pinned but untagged');
  const many = snap((s) => {
    for (const n of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) s.repos.push(repo(n));
    s.pins = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  });
  assert.equal(discover(many, manual, 'Folio').featured.length, 6);
});

test('projects with an order come first; the rest follow by last push', () => {
  const s = snap((s) => s.repos.push(repo('Old', { pushedAt: '2026-01-01T00:00:00Z' }), repo('New', { pushedAt: '2026-11-05T00:00:00Z' }), repo('Ranked', { folioYaml: 'order: 3' })));
  // Ranked shares order 3 with Orbis and keeps its place after it; unranked ones follow, newest push first.
  assert.deepEqual(shown(s), ['huepr', 'helios', 'nothing', 'orbis', 'ranked', 'campuseats', 'bct', 'mochi', 'new', 'old']);
});

test('games and lab apps are sorted out of the projects', () => {
  const d = discover(snap((s) => s.repos.push(repo('Snake', { topics: ['folio-play'] }), repo('Lander', { topics: ['folio-lab', 'folio'] }))), manual, 'Folio');
  assert.deepEqual(d.apps.map((a) => [a.kind, a.id]), [['play', 'snake'], ['lab', 'lander']]);
  assert.ok(!d.projects.some((p) => p.id === 'snake' || p.id === 'lander'));
});

test('a repository whose address is taken by a Folio project is left out, with a warning', () => {
  const d = discover(snap((s) => s.repos.push(repo('MOCHI-'))), manual, 'Folio');
  assert.equal(d.projects.filter((p) => p.id === 'mochi').length, 1);
  assert.match(d.warnings[0], /taken/);
});
