import type { TransitionBeforeSwapEvent, TransitionBeforePreparationEvent } from 'astro:transitions/client';
import { LOCALE_COOKIE } from '../i18n/locale';
import { copyText } from './copy';
import { applyAllCuts } from './cut';
import { installMotion, reducedMotion } from './motion';
import { directionOf, sectionOf } from './route';
import { getState, setContactOpen, setPage, startAutoSkinClock, subscribe, THEME_COLOR } from './store';

/* Everything the static parts of the page need in the browser. Runs once; the client router keeps
   this module alive across navigations, so page-specific setup happens on astro:page-load. */
let direction = 'up';
let uninstallMotion: (() => void) | undefined;
let firstLoad = true;

let returningFrom = '';
let activeTransition: ViewTransition | undefined;
let skipped: Promise<unknown> | null = null;

/* Shared media: a card's cover morphs into the case-study panel, and back again when returning. */
function prepareSharedMedia(from: URL, to: URL, source: Element | undefined) {
  returningFrom = '';
  if (!document.startViewTransition || reducedMotion()) return;
  const html = document.documentElement;
  if (sectionOf(to.pathname) === 'project' && source) {
    const media = source.querySelector<HTMLElement>('[data-media]') ?? source.closest('.cut')?.querySelector<HTMLElement>(':scope > .cut-fill');
    if (!media) return;
    media.style.setProperty('view-transition-name', 'media');
    media.setAttribute('data-vt-media', '');
    html.classList.add('vt-media');
  } else if (sectionOf(from.pathname) === 'project' && ['projects', 'home'].includes(sectionOf(to.pathname))) {
    returningFrom = from.pathname;
    html.classList.add('vt-media');
  }
}

function clearSharedMedia() {
  document.documentElement.classList.remove('vt-media');
  document.querySelectorAll<HTMLElement>('[data-vt-media]').forEach((el) => { el.style.removeProperty('view-transition-name'); el.removeAttribute('data-vt-media'); });
}

document.addEventListener('astro:before-preparation', (event) => {
  const { from, to, sourceElement } = event as TransitionBeforePreparationEvent;
  direction = (sourceElement as HTMLElement | undefined)?.dataset?.dir ?? directionOf(from.pathname, to.pathname);
  prepareSharedMedia(from, to, sourceElement);
});

document.addEventListener('astro:before-swap', (event) => {
  // The router copies <html> attributes from the incoming page, whose skin is the server default.
  const { newDocument: next, viewTransition } = event as TransitionBeforeSwapEvent;
  const html = next.documentElement, current = document.documentElement;
  html.dataset.skin = current.dataset.skin;
  html.dataset.dir = direction;
  html.className = current.className;
  next.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[getState().effective]);
  next.querySelector('link[data-skin-icon]')?.setAttribute('href', `/icons/${getState().effective}.svg`);
  activeTransition = viewTransition;
  viewTransition.finished.finally(() => { clearSharedMedia(); activeTransition = undefined; });
  uninstallMotion?.();
});

document.addEventListener('astro:after-swap', () => {
  setPage(location.pathname, document.querySelector<HTMLElement>('main')?.dataset.repo ?? '');
  if (returningFrom) {
    const media = document.querySelector<HTMLElement>(`a[href='${returningFrom}'] [data-media]`);
    const box = media?.getBoundingClientRect();
    if (media && box && box.top < innerHeight && box.bottom > 0) { media.style.setProperty('view-transition-name', 'media'); media.setAttribute('data-vt-media', ''); }
    else document.documentElement.classList.remove('vt-media');
  }
  if (!document.startViewTransition) {
    const main = document.querySelector('main');
    main?.classList.remove('page-in');
    requestAnimationFrame(() => main?.classList.add('page-in'));
  }
});

document.addEventListener('astro:page-load', () => {
  // Panels are clipped here, ahead of hydration, so they never wait on the framework to appear.
  applyAllCuts();
  uninstallMotion = installMotion(document.body);
  syncSkinLabel();
  if (firstLoad) { firstLoad = false; return; }
  document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true });
});

/* Nothing on the page can be hit while a transition is on screen. A press ends the transition at once,
   and the click it belonged to still reaches whatever is now under the pointer. */
document.addEventListener('pointerdown', () => {
  if (!activeTransition) return;
  activeTransition.skipTransition();
  skipped = activeTransition.finished.catch(() => {});
}, true);
document.addEventListener('click', (event) => {
  if (!skipped || event.target !== document.documentElement) return;
  const { clientX: x, clientY: y } = event, done = skipped;
  skipped = null;
  done.then(() => document.elementFromPoint(x, y)?.closest<HTMLElement>('a[href], button, [role="button"], summary, label')?.click());
}, true);

document.addEventListener('click', (event) => {
  const el = (event.target as Element).closest?.<HTMLElement>('[data-open-contact], [data-copy], [data-to-top], [data-set-lang]');
  if (!el) return;
  if ('openContact' in el.dataset) { event.preventDefault(); setContactOpen(true); }
  else if (el.dataset.copy) copyText(el.dataset.copy, el.dataset.copied!, el.dataset.copyBlocked!);
  else if ('toTop' in el.dataset) { event.preventDefault(); window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }); }
  else if (el.dataset.setLang) {
    event.preventDefault();
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${LOCALE_COOKIE}=${el.dataset.setLang}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    location.href = location.pathname;
  }
});

function syncSkinLabel() {
  const { skin, effective } = getState();
  const name = effective.charAt(0).toUpperCase() + effective.slice(1);
  document.querySelectorAll('[data-skin-label]').forEach((el) => { el.textContent = skin === 'auto' ? `Auto (${name})` : name; });
}

subscribe(syncSkinLabel);
startAutoSkinClock();
// Removed as soon as the choreography ends: browsers don't count text as painted before this.
window.setTimeout(() => document.documentElement.classList.remove('intro'), document.querySelector('.hero') ? 2000 : 1600);
