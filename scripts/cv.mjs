/* Prepares the CV viewer from public/cv/{en,tr}.pdf, once per CV change (pnpm cv), so the browser never loads a
   PDF library: each page as WebP at three widths (public/cv/<lang>-<page>-<width>.webp), and its text and links
   with their positions (src/cv/<lang>.json), which the page lays over the image as a selectable, searchable layer.
   Needs pdftoppm (poppler) and ImageMagick on this machine; the output is committed. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const WIDTHS = [800, 1240, 1800];
const round = (n) => Math.round(n * 100) / 100;

for (const lang of ['en', 'tr']) {
  const file = `public/cv/${lang}.pdf`;
  const pdf = await getDocument({ data: new Uint8Array(readFileSync(file)), verbosity: 0 }).promise;
  const pages = [];
  const tmp = mkdtempSync(join(tmpdir(), 'cv-'));
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const { width, height } = page.getViewport({ scale: 1 });
    const text = await page.getTextContent();
    const items = text.items
      .filter((i) => 'str' in i && i.str.trim())
      .map((i) => ({ s: i.str, x: round(i.transform[4]), y: round(height - i.transform[5]), w: round(i.width), f: round(Math.hypot(i.transform[2], i.transform[3])) }));
    const links = (await page.getAnnotations())
      .filter((a) => a.subtype === 'Link' && a.url)
      .map((a) => { const [x1, y1, x2, y2] = a.rect; return { url: a.url, x: round(x1), y: round(height - y2), w: round(x2 - x1), h: round(y2 - y1) }; });
    // Rendered at each width rather than scaled down: crisper text, and far fewer colours to compress.
    for (const w of WIDTHS) {
      const png = join(tmp, `p${n}-${w}`);
      execFileSync('pdftoppm', ['-png', '-f', String(n), '-l', String(n), '-singlefile', '-scale-to-x', String(w), '-scale-to-y', '-1', file, png]);
      execFileSync('magick', [`${png}.png`, '-define', 'webp:lossless=true', `public/cv/${lang}-${n}-${w}.webp`]);
    }
    pages.push({ w: round(width), h: round(height), items, links });
  }
  rmSync(tmp, { recursive: true, force: true });
  writeFileSync(`src/cv/${lang}.json`, JSON.stringify({ widths: WIDTHS, pages }) + '\n');
  console.log(`cv: ${lang}, ${pages.length} page(s), ${pages.reduce((n, p) => n + p.items.length, 0)} text runs, ${pages.reduce((n, p) => n + p.links.length, 0)} links`);
}
