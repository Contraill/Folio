/* Site settings that stay in code until the admin's settings editor (milestone 4). */
import type { Locale } from '../i18n/locale.ts';

export const GH = 'https://github.com/Contraill';
export const EMAIL = 'izzet@oztozlu.dev';

/* Project areas, indexed by a project's `d`. */
export const DOMAINS = ['Web', 'Desktop & theming', 'Self-hosted', 'Hardware', 'Desktop apps'];
export const DOMAIN_SLUG = ['web', 'theming', 'self-hosted', 'hardware', 'desktop-apps'];
const AREAS: Record<Locale, string[]> = { en: DOMAINS, tr: ['Web', 'Masaüstü ve tema', 'Self-hosted', 'Donanım', 'Masaüstü uygulamaları'] };
export const areasFor = (locale: Locale) => AREAS[locale];
