import { Copy, Printer } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import type { Cv as CvContent } from '@/content/schema';
import { EMAIL } from '@/content/site';
import type { Locale } from '@/i18n/locale';
import type { Messages } from '@/i18n/messages';
import { copyText } from '@/lib/copy';
import { Cut, Seg } from './kit';

const STORAGE_KEY = 'fx-cv';

export default function Cv({ locale, t, cvs }: { locale: Locale; t: Messages; cvs: Record<Locale, CvContent> }) {
  // Starts in the page language; a language picked here is remembered for this page only.
  const [lang, setLang] = useState<Locale>(locale);
  useEffect(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved === 'en' || saved === 'tr') setLang(saved); } catch { /* storage unavailable */ }
    const print = () => window.print();
    addEventListener('cv-print', print);
    return () => removeEventListener('cv-print', print);
  }, []);
  const pick = (next: Locale) => { setLang(next); try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage unavailable */ } };
  const { text: c, projects } = cvs[lang];
  const asText = () => [
    'İzzet Can Öztozlu — ' + c.role, `${EMAIL} · github.com/Contraill · oztozlu.dev`, '', c.profile.toUpperCase(), c.summary, '',
    c.experience.toUpperCase(), `${c.intern} · Up&Running`, '', c.projects.toUpperCase(), ...projects.map((p) => `${p[0]} (${p[1]}): ${p[2]}`), '',
    c.education.toUpperCase(), `${c.degree}, Eastern Mediterranean University, ${c.grad}`, '', c.skills.toUpperCase(), c.skillsLine,
  ].join('\n');
  return (
    <Cut as="section" className="slab pad cvwrap" label="CV">
      <div className="cut-fill" suppressHydrationWarning />
      <div className="dock cvbar" data-cut>
        <Seg label={t.language}>
          <button type="button" aria-pressed={lang === 'en'} onClick={() => pick('en')}>English</button>
          <button type="button" aria-pressed={lang === 'tr'} onClick={() => pick('tr')}>Türkçe</button>
        </Seg>
        <button type="button" className="btn btn-2 btn-sm" style={{ background: 'var(--slab)' }} onClick={() => copyText(asText(), c.copied, t.copyBlocked)} data-magnet aria-label={c.copyText}><Copy size={15} aria-hidden="true" /><span className="lbl">{c.copyText}</span></button>
        <button type="button" className="btn btn-1 cv-pdf" onClick={() => window.print()} aria-label={c.pdf}><span className="lbl">{c.pdf}</span><span className="ic"><Printer size={15} aria-hidden="true" /></span></button>
      </div>
      {/* The motion layer may add its class before this island hydrates. */}
      <div className="cv-head" data-reveal suppressHydrationWarning>
        <p className="eyebrow">CV</p>
        <h1 className="cv-h1">{c.heading}</h1>
        <p className="small" style={{ marginTop: 10 }}>{c.note}</p>
      </div>
      <article className="sheet" lang={lang} aria-label={c.sheetLabel} data-reveal suppressHydrationWarning style={{ '--i': 1 } as CSSProperties}>
        <header>
          <div><h2 className="cv-name">İzzet Can Öztozlu</h2><p className="role">{c.role}</p></div>
          <div className="contact" translate="no">{EMAIL}<br />github.com/Contraill<br />oztozlu.dev · {c.loc}</div>
        </header>
        <section><h2>{c.profile}</h2><div><p>{c.summary}</p></div></section>
        <section><h2>{c.experience}</h2><div><div className="item"><b>{c.intern} · Up&amp;Running <span className="ph">{c.dates}</span></b><p className="ph" style={{ display: 'inline-block', marginTop: 4 }}>{c.internPh}</p></div></div></section>
        <section><h2>{c.projects}</h2><div>{projects.map(([n, s, d]) => <div className="item" key={n}><b>{n}<span>{s}</span></b><p>{d}</p></div>)}</div></section>
        <section><h2>{c.education}</h2><div><div className="item"><b>{c.degree} <span>{c.grad}</span></b><p>Eastern Mediterranean University</p></div></div></section>
        <section><h2>{c.skills}</h2><div><p>{c.skillsLine}</p></div></section>
        <section style={{ borderBottom: 0 }}><h2>{c.languages}</h2><div><p>{c.langLine}<span className="ph">{c.level}</span></p></div></section>
      </article>
    </Cut>
  );
}
