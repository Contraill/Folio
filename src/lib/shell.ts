import type { TransitionBeforeSwapEvent, TransitionBeforePreparationEvent } from 'astro:transitions/client';
import { LOCALE_COOKIE } from '../i18n/locale';
import { copyText } from './copy';
import { installMotion, reducedMotion } from './motion';
import { directionOf } from './route';
import { getState, setContactOpen, setPath, startAutoSkinClock, subscribe, THEME_COLOR } from './store';

/* Everything the static parts of the page need in the browser. Runs once; the client router keeps
   this module alive across navigations, so page-specific setup happens on astro:page-load. */
let direction = 'up';
let uninstallMotion: (() => void) | undefined;
let firstLoad = true;

document.addEventListener('astro:before-preparation', (event) => {
  const { from, to } = event as TransitionBeforePreparationEvent;
  direction = directionOf(from.pathname, to.pathname);
});

document.addEventListener('astro:before-swap', (event) => {
  // The router copies <html> attributes from the incoming page, whose skin is the server default.
  const next = (event as TransitionBeforeSwapEvent).newDocument;
  const html = next.documentElement, current = document.documentElement;
  html.dataset.skin = current.dataset.skin;
  html.dataset.dir = direction;
  html.className = current.className;
  next.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[getState().effective]);
  uninstallMotion?.();
});

document.addEventListener('astro:after-swap', () => {
  setPath(location.pathname);
  if (!document.startViewTransition) {
    const main = document.querySelector('main');
    main?.classList.remove('page-in');
    requestAnimationFrame(() => main?.classList.add('page-in'));
  }
});

document.addEventListener('astro:page-load', () => {
  uninstallMotion = installMotion(document.body);
  syncSkinLabel();
  if (firstLoad) { firstLoad = false; return; }
  document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true });
});

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
window.setTimeout(() => document.documentElement.classList.remove('intro'), 2600);
