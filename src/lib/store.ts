import { useSyncExternalStore } from 'react';
import { applyAllCuts } from './cut';
import { reducedMotion, themeTransition } from './motion';

export type SkinKey = 'auto' | 'graphite' | 'paper' | 'blueprint' | 'terminal';
export type EffectiveSkin = Exclude<SkinKey, 'auto'>;
export const SKIN_KEYS: SkinKey[] = ['auto', 'graphite', 'paper', 'blueprint', 'terminal'];

type State = { skin: SkinKey; effective: EffectiveSkin; path: string; repo: string; searchOpen: boolean; contactOpen: boolean };

const STORAGE_KEY = 'fx-skin';
const THEME_COLOR: Record<EffectiveSkin, string> = { graphite: '#0f0f10', paper: '#e7eaee', blueprint: '#061529', terminal: '#000000' };
const inBrowser = typeof document !== 'undefined';

const autoSkin = (): EffectiveSkin => { const h = new Date().getHours(); return h >= 7 && h < 19 ? 'paper' : 'graphite'; };
const resolve = (skin: SkinKey): EffectiveSkin => (skin === 'auto' ? autoSkin() : skin);

function storedSkin(): SkinKey | null {
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'); return SKIN_KEYS.includes(value) ? value : null; } catch { return null; }
}

/* What the server rendered. Workers reuse module scope across requests, so this object must never
   hold request data: state only changes in the browser and everything per-request goes through props. */
const SERVER: State = { skin: 'graphite', effective: 'graphite', path: '/', repo: '', searchOpen: false, contactOpen: false };

let state: State = inBrowser
  ? { ...SERVER, skin: storedSkin() ?? 'graphite', effective: document.documentElement.dataset.skin as EffectiveSkin, path: location.pathname, repo: document.querySelector<HTMLElement>('main')?.dataset.repo ?? '' }
  : SERVER;

const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => { state = { ...state, ...patch }; listeners.forEach((fn) => fn()); };
export const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const getState = () => state;

/** Selector hook. During hydration it returns the server value, so markup always matches. */
export function useStore<T>(select: (s: State) => T, server: T = select(SERVER)) {
  return useSyncExternalStore(subscribe, () => select(state), () => server);
}

export const setPage = (path: string, repo: string) => set({ path, repo });
export const setSearchOpen = (searchOpen: boolean) => set({ searchOpen });
export const setContactOpen = (contactOpen: boolean) => set({ contactOpen });

function paint(effective: EffectiveSkin) {
  const html = document.documentElement;
  html.dataset.skin = effective;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[effective]);
  // The tab icon follows the skin as well.
  document.querySelector('link[data-skin-icon]')?.setAttribute('href', `/icons/${effective}.svg`);
}

/** Changes the skin; the new one spreads out in a circle from `from`. */
export function setSkin(skin: SkinKey, from?: { x: number; y: number }) {
  const html = document.documentElement;
  const x = from?.x ?? innerWidth - 120, y = from?.y ?? 30;
  html.style.setProperty('--vx', x + 'px');
  html.style.setProperty('--vy', y + 'px');
  html.style.setProperty('--vr', Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 'px');
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(skin)); } catch { /* private mode: lasts for this page only */ }
  themeTransition(() => {
    const effective = resolve(skin);
    paint(effective);
    set({ skin, effective });
    applyAllCuts();
  });
}

/** Keeps Auto correct while the page stays open: a soft fade, never an interruption. */
export function startAutoSkinClock() {
  window.setInterval(() => {
    if (state.skin !== 'auto') return;
    const effective = autoSkin();
    if (effective === state.effective) return;
    const html = document.documentElement;
    if (!reducedMotion()) { html.classList.add('skin-fade'); window.setTimeout(() => html.classList.remove('skin-fade'), 600); }
    paint(effective);
    set({ effective });
    applyAllCuts();
  }, 60000);
}

export { THEME_COLOR };
