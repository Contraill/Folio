import { flushSync } from 'react-dom';

/* One place decides what moves, when and how. Rules: transform/opacity only, one lead motion per
   view, everything off under prefers-reduced-motion, hover effects only for fine pointers. */
export const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Runs a same-page update inside a View Transition when the browser allows it. */
export function themeTransition(update: () => void) {
  if (!document.startViewTransition || reducedMotion()) { update(); return; }
  const html = document.documentElement;
  html.classList.add('vt-theme');
  document.startViewTransition(() => flushSync(update)).finished.finally(() => html.classList.remove('vt-theme'));
}

/* Global interaction layer, delegated so components stay declarative:
   data-reveal  fades or rises in when it enters the viewport
   data-depth   light parallax (fine pointer, wide screens)
   data-tilt    3D tilt toward the pointer
   data-magnet  small pull toward the pointer */
export function installMotion(root: HTMLElement) {
  const cleanups: (() => void)[] = [];
  const reduced = reducedMotion();

  // Masked elements are fully clipped at rest, so their parent is what gets observed.
  const proxy = new WeakMap<Element, Element[]>();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      (proxy.get(entry.target) ?? [entry.target]).forEach((el) => el.classList.add('in'));
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  // Tracked outside the DOM: islands may not have hydrated yet, and React expects their markup untouched.
  const watched = new WeakSet<Element>();
  const scan = () => root.querySelectorAll('[data-reveal]:not(.in)').forEach((el) => {
    if (reduced) { el.classList.add('in'); return; }
    if (watched.has(el)) return;
    watched.add(el);
    if (el.getAttribute('data-reveal') === 'mask' && el.parentElement) {
      const parent = el.parentElement;
      proxy.set(parent, [...(proxy.get(parent) ?? []), el]);
      io.observe(parent);
    } else io.observe(el);
  });
  // Images arrive softly once they have actually loaded, in static markup and islands alike.
  const showLoaded = () => root.querySelectorAll<HTMLImageElement>('img.media-img:not(.ok)').forEach((img) => { if (img.complete && img.naturalWidth) img.classList.add('ok'); });
  const onLoad = (e: Event) => { const el = e.target as Element; if (el.matches?.('img.media-img')) el.classList.add('ok'); };
  root.addEventListener('load', onLoad, true);
  // Large titles scale to the width of their container.
  const fit = (el: HTMLElement) => {
    el.style.fontSize = '100px';
    // Two pixels spare: text width rounds differently at the final size, and the mask would clip it.
    el.style.fontSize = Math.min(Number(el.dataset.fit) || 400, 100 * ((el.parentElement!.clientWidth - 2) / el.scrollWidth)) + 'px';
  };
  const fitted = root.querySelectorAll<HTMLElement>('[data-fit]');
  const fitAll = () => fitted.forEach(fit);
  fitAll();
  document.fonts?.ready.then(fitAll);
  const fitObserver = new ResizeObserver(fitAll);
  fitted.forEach((el) => fitObserver.observe(el.parentElement!));
  scan();
  showLoaded();
  const mo = new MutationObserver(() => { scan(); showLoaded(); });
  mo.observe(root, { childList: true, subtree: true });
  cleanups.push(() => { io.disconnect(); mo.disconnect(); fitObserver.disconnect(); root.removeEventListener('load', onLoad, true); });

  if (reduced) return () => cleanups.forEach((fn) => fn());

  // Parallax on wide screens with a fine pointer only: saves battery on phones.
  let raf = 0;
  const parallax = () => {
    raf = 0;
    const depths = root.querySelectorAll<HTMLElement>('[data-depth]');
    if (innerWidth < 900 || !finePointer()) { depths.forEach((el) => { el.style.transform = ''; }); return; }
    const vh = innerHeight;
    depths.forEach((el) => {
      const r = el.parentElement!.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const depth = parseFloat(el.dataset.depth || '0');
      el.style.transform = `translate3d(0, ${((r.top + r.height / 2 - vh / 2) * -depth).toFixed(1)}px, 0)`;
    });
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(parallax); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  cleanups.push(() => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); cancelAnimationFrame(raf); });
  parallax();

  // Tilt and magnet
  let tiltEl: HTMLElement | null = null, magnetEl: HTMLElement | null = null, frame = 0, last: PointerEvent | null = null;
  const reset = (el: HTMLElement | null) => { if (el) { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); el.classList.remove('tilting'); } };
  const apply = () => {
    frame = 0;
    const e = last;
    if (!e) return;
    const target = e.target as Element;
    const tilt = target.closest?.<HTMLElement>('[data-tilt]') ?? null;
    if (tiltEl && tiltEl !== tilt) reset(tiltEl);
    tiltEl = tilt;
    if (tilt) {
      const b = tilt.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5, k = parseFloat(tilt.dataset.tilt || '5');
      tilt.style.setProperty('--rx', (-y * k).toFixed(2) + 'deg');
      tilt.style.setProperty('--ry', (x * k).toFixed(2) + 'deg');
      tilt.style.setProperty('--px', ((x + 0.5) * 100).toFixed(1) + '%');
      tilt.style.setProperty('--py', ((y + 0.5) * 100).toFixed(1) + '%');
      tilt.classList.add('tilting');
    }
    const magnet = target.closest?.<HTMLElement>('[data-magnet]') ?? null;
    if (magnetEl && magnetEl !== magnet) reset(magnetEl);
    magnetEl = magnet;
    if (magnet) {
      const b = magnet.getBoundingClientRect();
      magnet.style.setProperty('--mx', ((e.clientX - b.left - b.width / 2) * 0.22).toFixed(1) + 'px');
      magnet.style.setProperty('--my', ((e.clientY - b.top - b.height / 2) * 0.22).toFixed(1) + 'px');
    }
  };
  const onMove = (e: PointerEvent) => { if (e.pointerType !== 'mouse') return; last = e; if (!frame) frame = requestAnimationFrame(apply); };
  const onLeave = () => { last = null; reset(tiltEl); reset(magnetEl); tiltEl = magnetEl = null; };
  root.addEventListener('pointermove', onMove);
  document.addEventListener('pointerleave', onLeave);
  root.addEventListener('pointerdown', onLeave);
  cleanups.push(() => { root.removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', onLeave); root.removeEventListener('pointerdown', onLeave); cancelAnimationFrame(frame); });

  return () => cleanups.forEach((fn) => fn());
}

/** FLIP: animates elements from their previous box to the new one. */
export function flip(container: HTMLElement | null, previous: Map<string, DOMRect>) {
  const next = new Map<string, DOMRect>();
  if (!container) return next;
  const items = [...container.querySelectorAll<HTMLElement>('[data-key]')];
  items.forEach((el) => next.set(el.dataset.key!, el.getBoundingClientRect()));
  if (reducedMotion() || !previous.size) return next;
  let entering = 0;
  items.forEach((el) => {
    const a = previous.get(el.dataset.key!), b = next.get(el.dataset.key!)!;
    if (a) {
      const dx = a.left - b.left, dy = a.top - b.top, sx = a.width / b.width, sy = a.height / b.height;
      if (Math.abs(dx) + Math.abs(dy) > 1 || Math.abs(sx - 1) > 0.01 || Math.abs(sy - 1) > 0.01)
        el.animate([{ transformOrigin: '0 0', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` }, { transformOrigin: '0 0', transform: 'none' }], { duration: 560, easing: 'cubic-bezier(.16,1,.3,1)' });
    } else {
      el.animate([{ opacity: 0, transform: 'translateY(18px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 40 * entering++, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    }
  });
  return next;
}
