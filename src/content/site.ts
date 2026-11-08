/* Site settings that stay in code. */
import type { Locale } from '../i18n/locale.ts';

export const GH = 'https://github.com/Contraill';
export const EMAIL = 'izzet@oztozlu.dev';
export const LINKEDIN = 'https://tr.linkedin.com/in/izzetcanoztozlu';

/* Project areas, indexed by a project's `d`. */
export const DOMAINS = ['Web', 'Desktop & theming', 'Self-hosted', 'Hardware', 'Desktop apps', 'Other'];
/* `other` is for repositories Folio has nothing written about yet: no area is guessed for them. */
export const DOMAIN_SLUG = ['web', 'theming', 'self-hosted', 'hardware', 'desktop-apps', 'other'];
const AREAS: Record<Locale, string[]> = { en: DOMAINS, tr: ['Web', 'Masaüstü ve tema', 'Self-hosted', 'Donanım', 'Masaüstü uygulamaları', 'Diğer'] };
export const areasFor = (locale: Locale) => AREAS[locale];
