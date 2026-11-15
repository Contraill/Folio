/* What the tests share: every page of the site, in both languages, as the sitemap lists them. */
export const PROJECTS = ['helios', 'campuseats', 'orbis', 'nodesk', 'bct', 'mochi', 'nothing', 'huepr'];
export const PATHS = ['/', '/cv', ...PROJECTS.map((id) => `/projects/${id}`)];
export const inLocale = (locale: 'en' | 'tr', path: string) => (locale === 'en' ? path : path === '/' ? '/tr' : `/tr${path}`);
export const PAGES = PATHS.flatMap((path) => [inLocale('en', path), inLocale('tr', path)]);
