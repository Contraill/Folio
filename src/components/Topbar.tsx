import * as Dialog from '@radix-ui/react-dialog';
import * as Popover from '@radix-ui/react-popover';
import { ArrowRight, Check, Copy, FolderGit2, Mail, Menu, Printer, Search, X } from 'lucide-react';
import { lazy, Suspense, useEffect, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import type { Locale } from '@/i18n/locale';
import type { Messages } from '@/i18n/messages';
import { copyText } from '@/lib/copy';
import { overlays, useReturnFocus } from '@/lib/overlay';
import { currentMenuItem, MENU } from '@/lib/route';
import { setContactOpen, setSearchOpen, setSkin, SKIN_KEYS, useStore, type SkinKey } from '@/lib/store';
import { EMAIL, GH } from '@/content/projects';
import { Arrow, Seg } from './kit';

const SearchPalette = lazy(() => import('./SearchPalette'));

export const hrefOf = (route: string) => (route === 'home' ? '/' : `/${route}`);

/* Monogram: a notched square (the site's panel language) with the dot of the i sitting in the notch. */
export const Mark = ({ s = 26 }: { s?: number }) => (
  <svg className="mark" width={s} height={s} viewBox="0 0 26 26" aria-hidden="true">
    <path className="sq" d="M15 3H8a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5v-7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    <circle className="dt" cx="22.7" cy="4.9" r="2.8" fill="currentColor" />
  </svg>
);

const SWATCH: Record<Exclude<SkinKey, 'auto'>, string> = {
  graphite: 'linear-gradient(135deg,#2e2e32 50%,#f3f3f1 50%)',
  paper: 'linear-gradient(135deg,#f4f1ea 50%,#161616 50%)',
  blueprint: 'linear-gradient(135deg,#0b2444 50%,#8fd8ff 50%)',
  terminal: 'linear-gradient(135deg,#050b05 50%,#7dffa8 50%)',
};

export function Swatch({ skin, size = 28 }: { skin: SkinKey; size?: number }) {
  // Auto: day and night share the disc along a soft S-curve (a nod to yin-yang, not the symbol).
  if (skin === 'auto') return (
    <span className="sw sw-auto" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 28 28" width={size} height={size}>
        <g transform="translate(14 14) scale(.94) translate(-14 -14)">
          <circle cx="14" cy="14" r="13.5" fill="#f4f1ea" />
          <path d="M14 .5a13.5 13.5 0 0 1 0 27a9 9 0 0 1 0-13.5a9 9 0 0 0 0-13.5Z" fill="#2e2e32" />
          <circle cx="8.6" cy="10.4" r="2.3" fill="#ffb020" />
          <circle cx="19.6" cy="18.2" r="2.4" fill="#f3f3f1" /><circle cx="20.7" cy="17.2" r="2.1" fill="#2e2e32" />
          <circle cx="14" cy="14" r="13.5" fill="none" stroke="rgba(128,128,128,.55)" strokeWidth=".8" />
        </g>
      </svg>
    </span>
  );
  return <span className="sw" style={{ width: size, height: size, background: SWATCH[skin] }} aria-hidden="true" />;
}

function SkinList({ t }: { t: Messages }) {
  const skin = useStore((s) => s.skin);
  const effective = useStore((s) => s.effective);
  const pick = (key: SkinKey, e: MouseEvent<HTMLButtonElement>) => {
    const origin = document.querySelector('[data-skin-trigger]')?.getBoundingClientRect();
    const sheetRow = e.currentTarget.closest('.ov-sheet') ? e.currentTarget.getBoundingClientRect() : null;
    const r = sheetRow ?? origin;
    setSkin(key, r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: e.clientX, y: e.clientY });
  };
  return (
    <div role="radiogroup" aria-label={t.skinWord}>
      {SKIN_KEYS.map((key) => (
        <button key={key} type="button" role="radio" aria-checked={skin === key} className="skin-opt" onClick={(e) => pick(key, e)}>
          <Swatch skin={key} />
          <span className="so-txt">
            <b>{t.skins[key][0]}{key === 'auto' && skin === 'auto' ? ` · ${t.skinNow.replace('{skin}', effective === 'paper' ? 'Paper' : 'Graphite')}` : ''}</b>
            <span>{t.skins[key][1]}</span>
          </span>
          {skin === key && <Check size={16} className="so-check" aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}

function SkinMenu({ t }: { t: Messages }) {
  const skin = useStore((s) => s.skin);
  return (
    <Popover.Root>
      <Popover.Trigger className="tool" data-skin-trigger aria-label={`${t.skinWord}: ${t.skins[skin][0]}`}><Swatch skin={skin} size={22} /></Popover.Trigger>
      <Popover.Portal container={overlays()}>
        <Popover.Content align="end" sideOffset={4} className="ov-pop skin-pop" aria-label={t.skinWord}><SkinList t={t} /></Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Sheet({ open, onOpenChange, className, closeLabel, children }: { open: boolean; onOpenChange: (open: boolean) => void; className: string; closeLabel: string; children: ReactNode }) {
  const returnFocus = useReturnFocus();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={overlays()}>
        <Dialog.Overlay className="ov-scrim" />
        <Dialog.Content className={'ov-sheet ' + className} {...returnFocus}>
          <Dialog.Close className="ov-close"><X aria-hidden="true" /><span className="sr">{closeLabel}</span></Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ContactSheet({ t }: { t: Messages }) {
  const open = useStore((s) => s.contactOpen);
  return (
    <Sheet open={open} onOpenChange={setContactOpen} className="ov-sheet-contact" closeLabel={t.close}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 30 }}>
        <p className="eyebrow">{t.contact}</p>
        <Dialog.Title className="display" style={{ fontSize: 44 }}>{t.sayHi}</Dialog.Title>
        <Dialog.Description className="small">{t.sayHiText}</Dialog.Description>
        <div className="contact-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', borderRadius: 14, background: 'var(--slab-2)' }}>
          <span className="mono" style={{ flex: 1, fontSize: 15 }} translate="no">{EMAIL}</span>
          <button type="button" className="circle" aria-label={t.copyEmail} onClick={() => copyText(EMAIL, t.emailCopied, t.copyBlocked)}><Copy size={16} aria-hidden="true" /></button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a className="btn btn-1" href={`mailto:${EMAIL}`}>{t.writeEmail}<span className="ic"><Mail size={16} aria-hidden="true" /></span></a>
          <a className="btn btn-2" href={GH} target="_blank" rel="noreferrer">GitHub <Arrow size={16} /></a>
        </div>
      </div>
    </Sheet>
  );
}

function MobileMenu({ open, set, current, t, locale }: { open: boolean; set: (open: boolean) => void; current: string; t: Messages; locale: Locale }) {
  return (
    <Sheet open={open} onOpenChange={set} className="ov-sheet-menu" closeLabel={t.close}>
      <Dialog.Title className="eyebrow" style={{ marginTop: 6 }}>{t.menu}</Dialog.Title>
      <Dialog.Description className="sr">{t.menuHint}</Dialog.Description>
      <nav aria-label={t.menu} style={{ display: 'flex', flexDirection: 'column', margin: '20px 0 26px' }}>
        {(['home', ...MENU] as const).map((route, i) => (
          <a key={route} href={hrefOf(route)} onClick={() => set(false)} aria-current={current === route ? 'page' : undefined} className="display mm-link"
            style={{ '--i': i, fontSize: 34, padding: '10px 0', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: current === route ? 1 : .8 } as CSSProperties}>
            {t.nav[route]}<ArrowRight size={20} aria-hidden="true" />
          </a>
        ))}
      </nav>
      <button type="button" className="btn btn-1" onClick={() => { set(false); setContactOpen(true); }}>{t.contact}<span className="ic"><Mail size={16} aria-hidden="true" /></span></button>
      <p className="eyebrow mm-skin">{t.skinWord}</p>
      <SkinList t={t} />
      <p className="eyebrow mm-skin">{t.language}</p>
      <Seg label={t.language}>
        <button type="button" lang="en" data-set-lang="en" aria-pressed={locale === 'en'}>English</button>
        <button type="button" lang="tr" data-set-lang="tr" aria-pressed={locale === 'tr'}>Türkçe</button>
      </Seg>
    </Sheet>
  );
}

export default function Topbar({ t, path: initialPath, repo: initialRepo = '', locale }: { t: Messages; path: string; repo?: string; locale: Locale }) {
  const path = useStore((s) => s.path, initialPath);
  const repo = useStore((s) => s.repo, initialRepo);
  const searchOpen = useStore((s) => s.searchOpen);
  const [menu, setMenu] = useState(false);
  const [searchUsed, setSearchUsed] = useState(false);
  useEffect(() => { if (searchOpen) setSearchUsed(true); }, [searchOpen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); } };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);
  const current = currentMenuItem(path);
  return (
    <header className="topbar">
      <a className="cap brand" href="/" aria-label={t.home} aria-current={current === 'home' ? 'page' : undefined}><Mark /><span className="brand-name" aria-hidden="true">İzzet Can</span></a>
      <nav className="cap navcap" aria-label={t.navLabel}>
        <Seg label={t.pagesLabel}>
          {MENU.map((route) => <a key={route} href={hrefOf(route)} aria-current={current === route ? 'page' : undefined}>{t.nav[route]}</a>)}
        </Seg>
      </nav>
      <div className="cap tools">
        <button type="button" className="tool" onClick={() => setSearchOpen(true)} aria-label={t.search} aria-keyshortcuts="Control+K Meta+K"><Search size={18} aria-hidden="true" /><span className="kbd" aria-hidden="true" /></button>
        {current === 'projects' && <a className="tool" href={repo || GH} target="_blank" rel="noreferrer" aria-label={repo ? t.repository : t.github}><FolderGit2 size={18} aria-hidden="true" /></a>}
        {current === 'cv' && <button type="button" className="tool" aria-label={t.printCv} onClick={() => dispatchEvent(new Event('cv-print'))}><Printer size={18} aria-hidden="true" /></button>}
        <SkinMenu t={t} />
        <button type="button" className="btn btn-1 contact-btn" onClick={() => setContactOpen(true)}>{t.contact}<span className="ic"><Mail size={15} aria-hidden="true" /></span></button>
        <button type="button" className="tool menu-btn" aria-label={t.openMenu} aria-expanded={menu} onClick={() => setMenu(true)}><Menu size={20} aria-hidden="true" /></button>
      </div>
      <MobileMenu open={menu} set={setMenu} current={current} t={t} locale={locale} />
      <ContactSheet t={t} />
      {searchUsed && <Suspense fallback={null}><SearchPalette t={t} /></Suspense>}
    </header>
  );
}
