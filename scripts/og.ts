/* `pnpm og`: the share images (Open Graph, 1200×630 PNG) in public/og/, drawn by a headless Chromium from the site's
   own fonts, colours and screenshots. One for the home page and one for each project, in both languages. Run it again
   after changing a project's name, lede or image, the role, or the stack; the PNGs are committed like the CV pages. */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { parse } from 'yaml';
import { caseOrder, featured, ui, type Locale } from '../src/data.ts';

const root = new URL('..', import.meta.url);
const file = (path: string) => new URL(path.replace(/^\//, ''), new URL('public/', root)).href;
const out = new URL('public/og/', root);
mkdirSync(out, { recursive: true });

type Img = { src: string; w: number; h: number };
type Project = { name: string; lang: string; img?: Img; hero?: Img; pos?: string; case: { lede: string; stack: string } };
const front = (path: URL) => parse(readFileSync(path, 'utf8').split('---')[1]) as Partial<Project>;
const project = (id: string, locale: Locale): Project => {
  const dir = new URL(`src/content/projects/${id}/`, root);
  return { ...front(new URL('en.md', dir)), ...(locale === 'tr' ? front(new URL('tr.md', dir)) : {}) } as Project;
};
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const base = `
  @font-face { font-family: Archivo; src: url(${file('/fonts/archivo.woff2')}); font-weight: 100 900; font-stretch: 62% 125%; }
  @font-face { font-family: Geist; src: url(${file('/fonts/geist.woff2')}); font-weight: 100 900; }
  @font-face { font-family: 'Geist Mono'; src: url(${file('/fonts/geistmono.woff2')}); font-weight: 100 900; }
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body { position: relative; background: #0b0c0e; color: #f5f5f5; font-family: Geist, sans-serif; -webkit-font-smoothing: antialiased; }
  .glow { position: absolute; inset: 0; background: radial-gradient(520px 420px at 900px 300px, rgba(16,157,217,.16), transparent 70%); }
  .mono { font-family: 'Geist Mono', monospace; }
  .site { position: absolute; left: 72px; bottom: 54px; font: 500 22px 'Geist Mono', monospace; color: #8a919b; }
  .site b { color: #109dd9; font-weight: 600; }
  .mochi { width: 280px; padding: 18px 22px; background: #000; border-radius: 22px; box-shadow: inset 0 0 0 2px #24262b, 0 0 0 12px #151619, 0 0 0 13px rgba(255,255,255,.08), 0 40px 80px rgba(0,0,0,.6), 0 0 120px rgba(16,157,217,.22); }
  .mochi svg { display: block; width: 100%; height: auto; fill: #eaf2ff; }
`;
const MOCHI = '<div class="mochi"><svg viewBox="0 0 128 64"><rect x="38" y="18" width="16" height="24" rx="3"/><rect x="74" y="18" width="16" height="24" rx="3"/><rect x="59" y="48" width="10" height="3" rx="1.5"/></svg></div>';

// The constellation behind Mochi, as in the hero: the stack as stars, linked to their neighbours and to Mochi.
const STARS: [string, number, number][] = [
  ['TypeScript', 760, 120], ['React', 980, 92], ['Node.js', 1096, 196], ['Python', 708, 250], ['Docker', 1112, 404],
  ['Linux', 744, 470], ['FastAPI', 938, 532], ['ESP32', 1080, 520], ['Vue 3', 860, 186], ['Three.js', 800, 588],
];
const sky = () => {
  const lines: string[] = [];
  STARS.forEach(([, x, y], i) => STARS.forEach(([, x2, y2], j) => {
    if (j > i && Math.hypot(x - x2, y - y2) < 250) lines.push(`<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="rgba(82,100,115,.45)"/>`);
  }));
  STARS.slice(0, 6).forEach(([, x, y]) => lines.push(`<line x1="930" y1="315" x2="${x}" y2="${y}" stroke="rgba(16,157,217,.3)"/>`));
  const dots = STARS.map(([label, x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#8bd5ff"/><text x="${x + 10}" y="${y + 5}" fill="#8a919b" font-family="Geist Mono" font-size="15">${label}</text>`);
  return `<svg width="1200" height="630" style="position:absolute;inset:0">${lines.join('')}${dots.join('')}</svg>`;
};

const home = (locale: Locale) => `<style>${base}
  .text { position: absolute; left: 72px; top: 118px; width: 640px; }
  .segments { display: flex; font: 600 20px/1 'Geist Mono', monospace; }
  .segments span { padding: 12px 28px 12px 18px; clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%); }
  .segments span:first-child { background: #109dd9; color: #090909; border-radius: 999px 0 0 999px; }
  .segments span:last-child { margin-left: -8px; padding-left: 26px; background: #1b1d21; color: #f5f5f5; }
  /* Two lines, sized to the column by fit() below; the line height leaves room for the dots on İ and Ö. */
  h1 { margin-top: 30px; font: 820 100px/1.02 Archivo, sans-serif; font-stretch: 125%; text-transform: uppercase; white-space: nowrap; }
  .role { margin-top: 34px; font: 600 34px/1 'Geist Mono', monospace; }
  .role i { font-style: normal; color: #109dd9; margin-right: 18px; }
  .role u { display: inline-block; width: 13px; height: 34px; margin-left: 6px; vertical-align: -4px; background: #109dd9; text-decoration: none; }
  .place { position: absolute; left: 930px; top: 315px; transform: translate(-50%, -50%); }
</style>
<div class="glow"></div>${sky()}
<div class="place">${MOCHI}</div>
<div class="text">
  <div class="segments"><span>~/oztozlu.dev</span><span>main</span></div>
  <h1 class="fit">İzzet Can<br>Öztozlu</h1>
  <p class="role"><i>❯</i>${esc(ui[locale].role)}<u></u></p>
</div>
<p class="site"><b>❯</b> oztozlu.dev</p>`;

const card = (id: string, locale: Locale) => {
  const p = project(id, locale);
  // The home page's label where the project has one, otherwise the first three parts of its stack.
  const kicker = featured.find((f) => f.id === id)?.kicker[locale] ?? p.case.stack.split(' · ').slice(0, 3).join(' · ');
  const img = p.hero ?? p.img;
  const media = img
    ? `<div class="shot"><img src="${file(img.src)}" style="object-position:${p.pos ?? '50% 50%'}"></div>`
    : `<div class="shot pet">${MOCHI}</div>`;
  return `<style>${base}
  .text { position: absolute; left: 72px; top: 70px; width: 500px; height: 470px; display: flex; flex-direction: column; }
  .who { font: 500 20px 'Geist Mono', monospace; color: #8a919b; }
  .kicker { margin-top: 44px; font: 600 21px/1.3 'Geist Mono', monospace; color: #8bd5ff; }
  h1 { margin-top: 14px; font: 800 ${p.name.length > 12 ? 62 : 84}px/1 Archivo, sans-serif; font-stretch: 115%; }
  .lede { margin-top: 22px; font: 400 25px/1.4 Geist, sans-serif; color: #c3c7ce; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .shot { position: absolute; left: 624px; top: 64px; width: 520px; height: 502px; border-radius: 24px; overflow: hidden; background: #151619; box-shadow: inset 0 0 0 1px rgba(255,255,255,.08), 0 40px 90px rgba(0,0,0,.6); }
  .shot img { width: 100%; height: 100%; object-fit: cover; }
  .shot.pet { display: grid; place-items: center; background: radial-gradient(circle at 50% 50%, rgba(16,157,217,.18), #151619 70%); }
</style>
<div class="glow"></div>${media}
<div class="text">
  <p class="who">İzzet Can Öztozlu</p>
  <p class="kicker">${esc(kicker)}</p>
  <h1 class="fit">${esc(p.name)}</h1>
  <p class="lede">${esc(p.case.lede)}</p>
</div>
<p class="site"><b>❯</b> oztozlu.dev/${locale === 'tr' ? 'tr/' : ''}projects/${id}</p>`;
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
// Loaded from a file, not set as content, so the page may read the fonts and screenshots from public/.
const tmp = mkdtempSync(join(tmpdir(), 'og-'));
const shoot = async (name: string, html: string) => {
  const at = join(tmp, 'page.html');
  writeFileSync(at, `<!doctype html><meta charset="utf-8"><body>${html}</body>`);
  await page.goto(pathToFileURL(at).href, { waitUntil: 'load' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Shrinks a .fit heading until it fits its column: no line, and no single long word, may run past it.
    const h = document.querySelector<HTMLElement>('.fit');
    if (h) for (let size = parseFloat(getComputedStyle(h).fontSize); size > 40 && h.scrollWidth > h.parentElement!.clientWidth; size--) h.style.fontSize = `${size}px`;
  });
  await page.screenshot({ path: new URL(`${name}.png`, out).pathname });
  console.log(`public/og/${name}.png`);
};
for (const locale of ['en', 'tr'] as const) {
  await shoot(`home-${locale}`, home(locale));
  for (const id of caseOrder) await shoot(`${id}-${locale}`, card(id, locale));
}
await browser.close();
rmSync(tmp, { recursive: true });
