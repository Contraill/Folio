import { ArrowDown, ArrowUpRight, FileText } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import type { Locale } from '@/i18n/locale';
import type { Messages } from '@/i18n/messages';
import { Cut, Seg, useMedia } from './kit';

const STORAGE_KEY = 'fx-cv';
const NAMES: Record<Locale, string> = { en: 'English', tr: 'Türkçe' };
/* The CVs are the owner's own PDFs in public/cv. Replacing a file is all an update takes; this page only points at them. */
const file = (lang: Locale) => `/cv/${lang}.pdf`;
const download = (lang: Locale) => `Izzet-Can-Oztozlu-CV-${lang.toUpperCase()}.pdf`;

export default function Cv({ locale, t }: { locale: Locale; t: Messages }) {
  // Starts in the page language; a language picked here is remembered for this page only.
  const [lang, setLang] = useState<Locale>(locale);
  // The PDF is embedded only where the browser can show it inline; phones get open and download instead.
  const [viewer, setViewer] = useState(false);
  const narrow = useMedia('(max-width: 760px)');
  useEffect(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved === 'en' || saved === 'tr') setLang(saved); } catch { /* storage unavailable */ }
    setViewer(navigator.pdfViewerEnabled !== false);
  }, []);
  const pick = (next: Locale) => { setLang(next); try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage unavailable */ } };
  const inline = viewer && !narrow;
  const label = t.cv.frame.replace('{lang}', NAMES[lang]);
  const open = <a className="btn btn-2 btn-sm" href={file(lang)} target="_blank" rel="noopener" type="application/pdf" hrefLang={lang} style={{ background: 'var(--slab)' }}>{t.cv.open}<ArrowUpRight size={15} aria-hidden="true" /></a>;
  const save = <a className="btn btn-1 cv-pdf" href={file(lang)} download={download(lang)} type="application/pdf" hrefLang={lang}><span className="lbl">{t.cv.download}</span><span className="ic"><ArrowDown size={15} aria-hidden="true" /></span></a>;
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
      {inline ? (
        <iframe key={lang} className="cv-frame" src={`${file(lang)}#view=FitH`} title={label} lang={lang} data-reveal suppressHydrationWarning style={{ '--i': 1 } as CSSProperties} />
      ) : (
        <div className="cv-card" lang={lang} data-reveal suppressHydrationWarning style={{ '--i': 1 } as CSSProperties}>
          <FileText size={40} aria-hidden="true" />
          <div><p className="cv-card-name">İzzet Can Öztozlu — CV</p><p className="small">{NAMES[lang]} · PDF</p></div>
          <div className="cv-card-actions">{open}{save}</div>
        </div>
      )}
    </Cut>
  );
}
