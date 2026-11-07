/* The CV viewer's engine: pdf.js, loaded only on the CV page and only once it is shown. The PDF is fetched from this
   site (never through a third party) and drawn into canvases, with pdf.js's text layer over each page so the text can
   be selected, searched and read aloud, and the PDF's own links kept clickable. pdf.js runs its parser in a worker
   served from this site, without WebAssembly or eval, so the page's Content Security Policy stays as it is. */
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

type Pdfjs = typeof import('pdfjs-dist');
type Doc = Awaited<ReturnType<Pdfjs['getDocument']>['promise']>;

let library: Promise<Pdfjs> | undefined;
const pdfjs = () => (library ??= import('pdfjs-dist').then((lib) => { lib.GlobalWorkerOptions.workerSrc = workerUrl; return lib; }));
const docs = new Map<string, Promise<Doc>>();

/** The document at `url`, loaded once per page view. */
export function load(url: string): Promise<Doc> {
  if (!docs.has(url)) {
    const doc = (async () => {
      const res = await fetch(url, { headers: { accept: 'application/pdf' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const lib = await pdfjs();
      return lib.getDocument({ data: new Uint8Array(await res.arrayBuffer()), useWasm: false }).promise;
    })();
    doc.catch(() => docs.delete(url));
    docs.set(url, doc);
  }
  return docs.get(url)!;
}

/** Page sizes at scale 1, in CSS pixels: enough to lay out every page before any is drawn. */
export async function sizes(doc: Doc) {
  return Promise.all(Array.from({ length: doc.numPages }, async (_, i) => { const v = (await doc.getPage(i + 1)).getViewport({ scale: 1 }); return { w: v.width, h: v.height }; }));
}

/** Draws one page into `box` at `scale`: a canvas as sharp as the display, the text layer and the links. */
export async function draw(doc: Doc, number: number, box: HTMLElement, scale: number, signal: AbortSignal) {
  const lib = await pdfjs();
  const page = await doc.getPage(number);
  const viewport = page.getViewport({ scale });
  const dpr = Math.min(devicePixelRatio || 1, 3);
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.setAttribute('aria-hidden', 'true');
  const task = page.render({ canvas, viewport, transform: dpr === 1 ? undefined : [dpr, 0, 0, dpr, 0, 0] });
  signal.addEventListener('abort', () => task.cancel(), { once: true });
  await task.promise;
  if (signal.aborted) return;

  const text = document.createElement('div');
  text.className = 'textLayer';
  await new lib.TextLayer({ textContentSource: page.streamTextContent(), container: text, viewport }).render();

  const links = document.createElement('div');
  links.className = 'cv-links';
  for (const a of await page.getAnnotations({ intent: 'display' })) {
    if (a.subtype !== 'Link' || typeof a.url !== 'string' || !/^(https?:|mailto:)/.test(a.url)) continue;
    const [x1, y1] = viewport.convertToViewportPoint(a.rect[0], a.rect[1]);
    const [x2, y2] = viewport.convertToViewportPoint(a.rect[2], a.rect[3]);
    const link = Object.assign(document.createElement('a'), { href: a.url, rel: 'noopener', tabIndex: -1 });
    if (!a.url.startsWith('mailto:')) link.target = '_blank';
    link.setAttribute('aria-hidden', 'true'); // the text layer already reads the same words
    Object.assign(link.style, { left: `${Math.min(x1, x2)}px`, top: `${Math.min(y1, y2)}px`, width: `${Math.abs(x2 - x1)}px`, height: `${Math.abs(y2 - y1)}px` });
    links.appendChild(link);
  }
  if (signal.aborted) return;
  box.style.setProperty('--total-scale-factor', String(scale));
  box.replaceChildren(canvas, text, links);
}
