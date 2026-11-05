import { ArrowUpRight } from 'lucide-react';
import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { applyCut } from '@/lib/cut';

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
  return <Tag ref={ref as never} className={'cut ' + className} style={style} aria-label={label}>{children}</Tag>;
}

export const Arrow = ({ size = 18 }: { size?: number }) => <ArrowUpRight size={size} aria-hidden="true" />;

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
