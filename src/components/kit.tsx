import { ArrowUpRight } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useSyncExternalStore, type CSSProperties, type ReactNode, type RefObject } from 'react';
import type { Img as ImgT } from '@/content/schema';
import { applyCut } from '@/lib/cut';

/** Media query as state. Always false during hydration, so markup matches the server. */
export function useMedia(query: string) {
  return useSyncExternalStore(
    (notify) => { const mq = matchMedia(query); mq.addEventListener('change', notify); return () => mq.removeEventListener('change', notify); },
    () => matchMedia(query).matches,
    () => false,
  );
}

/** Notched panel. The fill is re-clipped whenever anything that shapes it may have moved. */
export function Cut({ className = '', style, children, as: Tag = 'div', label }: { className?: string; style?: CSSProperties; children: ReactNode; as?: 'div' | 'section'; label?: string }) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const run = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => applyCut(el)); };
    applyCut(el);
    const ro = new ResizeObserver(run);
    ro.observe(el);
    el.querySelectorAll('[data-cut]').forEach((dock) => ro.observe(dock));
    const fill = el.querySelector(':scope > .cut-fill');
    if (fill) ro.observe(fill);
    document.fonts?.ready.then(run);
    addEventListener('resize', run);
    el.addEventListener('animationend', run);
    el.addEventListener('transitionend', run);
    const late = window.setTimeout(run, 1500);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(late);
      removeEventListener('resize', run);
      el.removeEventListener('animationend', run);
      el.removeEventListener('transitionend', run);
    };
  });
  // The panel is clipped before hydration so it never paints un-notched.
  return <Tag ref={ref as never} className={'cut ' + className} style={style} aria-label={label} suppressHydrationWarning>{children}</Tag>;
}

export const Arrow = ({ size = 18 }: { size?: number }) => <ArrowUpRight size={size} aria-hidden="true" />;

/** Arrow inside a circle that launches out and comes back on hover. */
export const Go = ({ size = 18, solid = false, glass = false }: { size?: number; solid?: boolean; glass?: boolean }) => (
  <span className={'circle launch' + (solid ? ' solid' : '') + (glass ? ' glass' : '')} aria-hidden="true"><ArrowUpRight size={size} /></span>
);

/** Segmented control with a sliding indicator. */
export function Seg({ children, label, className = '', as: Tag = 'div' }: { children: ReactNode; label: string; className?: string; as?: 'div' | 'nav' }) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current!, ind = el.querySelector<HTMLElement>(':scope > .ind')!;
    const place = (instant: boolean) => {
      const active = el.querySelector<HTMLElement>(':scope > [aria-current="page"], :scope > [aria-pressed="true"]');
      if (!active) { ind.style.opacity = '0'; return; }
      if (instant) ind.style.transition = 'none';
      ind.style.opacity = '1';
      ind.style.width = active.offsetWidth + 'px';
      ind.style.height = active.offsetHeight + 'px';
      ind.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
      if (instant) { void ind.offsetWidth; ind.style.transition = ''; }
    };
    place(!el.classList.contains('has-ind'));
    el.classList.add('has-ind');
    const ro = new ResizeObserver(() => place(true));
    ro.observe(el);
    document.fonts?.ready.then(() => place(true));
    return () => ro.disconnect();
  });
  return <Tag ref={ref as never} className={'seg ' + className} role={Tag === 'div' ? 'group' : undefined} aria-label={label}><span className="ind" aria-hidden="true" />{children}</Tag>;
}

/** Headline whose lines rise out of their own masks. */
export function Lines({ lines, className = '', delay = 0 }: { lines: ReactNode[]; className?: string; delay?: number }) {
  return <span className={'lines ' + className}>{lines.map((line, k) => <span key={k} className="ln" style={{ '--k': k, '--d': delay + 'ms' } as CSSProperties}><span>{line}</span></span>)}</span>;
}

/** rAF loop that sleeps off-screen, in hidden tabs, and whenever the frame reports that nothing
    will change (returns false). The returned wake() restarts it after an input. */
export function useLoop(ref: RefObject<HTMLElement | null>, fn: (now: number) => boolean | void, fps = 60, dep: unknown = 0) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const wakeRef = useRef(() => {});
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0, visible = false, last = 0;
    const step = 1000 / fps;
    const loop = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (now - last >= step - 1) { last = now; if (fnRef.current(now) === false) return; }
      raf = requestAnimationFrame(loop);
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(loop); };
    wakeRef.current = wake;
    const io = new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; wake(); }, { rootMargin: '60px' });
    io.observe(el);
    const ro = new ResizeObserver(wake);
    ro.observe(el);
    document.addEventListener('visibilitychange', wake);
    fnRef.current(performance.now());
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', wake); };
  }, [ref, fps, dep]);
  return useCallback(() => wakeRef.current(), []);
}

/** Fades in once loaded; the global motion layer adds the class, which React must leave alone. */
export function Img({ im, alt, pos, contain, eager = false }: { im: ImgT; alt: string; pos?: string; contain?: boolean; eager?: boolean }) {
  return <img className="media-img" src={im.src} width={im.w} height={im.h} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" suppressHydrationWarning
    style={{ objectPosition: pos ?? '50% 50%', objectFit: contain ? 'contain' : 'cover', background: contain ? '#111' : undefined }} />;
}
