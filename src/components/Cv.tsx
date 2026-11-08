import { ArrowDown, ArrowUpRight, FileText, Maximize, Minus, Plus } from 'lucide-react';
import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '@/i18n/locale';
import type { Messages } from '@/i18n/messages';
import { Cut, Seg } from './kit';

const STORAGE_KEY = 'fx-cv';
const NAMES: Record<Locale, string> = { en: 'English', tr: 'Türkçe' };
/* The CVs are the owner's own PDFs in public/cv. Replacing a file is all an update takes; this page only shows them. */
const file = (lang: Locale) => `/cv/${lang}.pdf`;
const download = (lang: Locale) => `Izzet-Can-Oztozlu-CV-${lang.toUpperCase()}.pdf`;
/** The widest a page is drawn when fitting: wider is harder to read, not easier. */
const MAX_FIT = 880;
const clamp = (scale: number) => Math.min(4, Math.max(0.4, scale));

type Size = { w: number; h: number };

/* The CV page. The PDF is drawn by the site itself (src/lib/pdf.ts), so it looks the same in every browser, can't be
   taken over by a download manager or a PDF plug-in, and sits on the page in the current skin. Without JavaScript, or if
   drawing fails, the same place offers to open or download the original file. */
export default function Cv({ locale, t }: { locale: Locale; t: Messages }) {
  // Starts in the page language; a language picked here is remembered for this page only.
  const [lang, setLang] = useState<Locale>(locale);
  const [state, setState] = useState<'static' | 'loading' | 'ready' | 'failed'>('static');
  const [pages, setPages] = useState<Size[]>([]);
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [room, setRoom] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const boxes = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved === 'en' || saved === 'tr') setLang(saved); } catch { /* storage unavailable */ }
  }, []);
  const pick = (next: Locale) => { setLang(next); try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage unavailable */ } };

  // The room the stage gives a page, followed as the window changes.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setRoom(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [state]);

  useEffect(() => {
    let live = true;
    setState('loading');
    import('@/lib/pdf').then(async ({ load, sizes }) => {
      const found = await sizes(await load(file(lang)));
      if (live) { setPages(found); setState('ready'); }
    }).catch(() => { if (live) setState('failed'); });
    return () => { live = false; };
  }, [lang]);

  const gutter = room < 600 ? 24 : 64;
  const fit = pages[0] ? Math.min(room - gutter, MAX_FIT) / pages[0].w : 1;
  const scale = zoom === 'fit' ? clamp(fit) : zoom;

  // Draws every page at the current scale; a newer request cancels the one in progress.
  useEffect(() => {
    if (state !== 'ready' || !room) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const { load, draw } = await import('@/lib/pdf');
      const doc = await load(file(lang));
      await Promise.all(pages.map((_, i) => boxes.current[i] && draw(doc, i + 1, boxes.current[i]!, scale, controller.signal))).catch(() => { if (!controller.signal.aborted) setState('failed'); });
    }, 80);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [state, lang, pages, scale, room]);

  const step = useCallback((factor: number) => setZoom(clamp(Math.round(scale * factor * 100) / 100)), [scale]);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === '+' || e.key === '=') { e.preventDefault(); step(1.25); }
    else if (e.key === '-') { e.preventDefault(); step(0.8); }
    else if (e.key === '0') { e.preventDefault(); setZoom('fit'); }
  };

  const label = t.cv.frame.replace('{lang}', NAMES[lang]);
  const open = <a className="btn btn-2 btn-sm" href={file(lang)} target="_blank" rel="noopener" type="application/pdf" hrefLang={lang} style={{ background: 'var(--slab)' }}>{t.cv.open}<ArrowUpRight size={15} aria-hidden="true" /></a>;
  const save = <a className="btn btn-1 cv-pdf" href={file(lang)} download={download(lang)} type="application/pdf" hrefLang={lang} aria-label={t.cv.download}><span className="lbl">{t.cv.download}</span><span className="ic"><ArrowDown size={15} aria-hidden="true" /></span></a>;
  const card = (
    <div className="cv-card" lang={lang} data-reveal data-static={state === 'static' ? '' : undefined} suppressHydrationWarning style={{ '--i': 1 } as CSSProperties}>
      <FileText size={40} aria-hidden="true" />
      <div><p className="cv-card-name">İzzet Can Öztozlu — CV</p><p className="small" role={state === 'failed' ? 'alert' : undefined}>{state === 'failed' ? t.cv.failed : `${NAMES[lang]} · PDF`}</p></div>
      <div className="cv-card-actions">{open}{save}</div>
    </div>
  );

  return (
    <Cut as="section" className="slab pad cvwrap" label="CV">
      <div className="cut-fill" suppressHydrationWarning />
      <div className="dock cvbar" data-cut>
        <Seg label={t.language}>
          {(['en', 'tr'] as const).map((l) => <button key={l} type="button" lang={l} aria-pressed={lang === l} onClick={() => pick(l)}>{NAMES[l]}</button>)}
        </Seg>
        {open}
        {save}
      </div>
      {/* The motion layer may add its class before this island hydrates. */}
      <div className="cv-head" data-reveal suppressHydrationWarning>
        <p className="eyebrow">CV</p>
        <h1 className="cv-h1">{t.cv.heading}</h1>
        <p className="small" style={{ marginTop: 10 }}>{t.cv.note}</p>
      </div>
      {state === 'static' || state === 'failed' ? card : (
        <div className="cv-viewer" data-state={state}>
          <div ref={stage} className="cv-stage" tabIndex={0} role="region" aria-label={t.cv.viewer} aria-busy={state === 'loading'} onKeyDown={onKey}>
            {state === 'loading' ? (
              <div className="cv-page cv-blank" role="status"><span>{t.cv.loading}</span></div>
            ) : pages.map((p, i) => (
              <div key={`${lang}-${i}`} ref={(el) => { boxes.current[i] = el; }} className="cv-page" lang={lang} role="document" aria-label={label}
                style={{ width: p.w * scale, height: p.h * scale }} />
            ))}
          </div>
          <div className="cv-zoom glass" role="group" aria-label={t.cv.zoom}>
            <button type="button" className="circle sm" onClick={() => step(0.8)} aria-label={t.cv.zoomOut} disabled={state !== 'ready' || scale <= 0.41}><Minus size={16} aria-hidden="true" /></button>
            <output className="tnum" aria-live="polite">{Math.round(scale * 100)}%</output>
            <button type="button" className="circle sm" onClick={() => step(1.25)} aria-label={t.cv.zoomIn} disabled={state !== 'ready' || scale >= 3.99}><Plus size={16} aria-hidden="true" /></button>
            <button type="button" className="circle sm" onClick={() => setZoom('fit')} aria-label={t.cv.fit} aria-pressed={zoom === 'fit'} disabled={state !== 'ready'}><Maximize size={15} aria-hidden="true" /></button>
          </div>
        </div>
      )}
    </Cut>
  );
}
