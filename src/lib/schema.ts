/* Structured data (schema.org JSON-LD) for search engines: who the site is about on the home page, and each project
   as a piece of software by that person. Facts come from src/data.ts and the project write-ups. */
import { cv, EMAIL, GITHUB, LINKEDIN, localePath, ui, type Locale } from '../data';
import type { Project } from './projects';

const SITE = 'https://oztozlu.dev';
const PERSON = `${SITE}/#person`;
const WEBSITE = `${SITE}/#website`;
const url = (locale: Locale, path: string) => SITE + localePath(locale, path).replace(/^\/$/, '/');

const person = (locale: Locale) => ({
  '@type': 'Person',
  '@id': PERSON,
  name: 'İzzet Can Öztozlu',
  alternateName: 'Izzet Can Oztozlu',
  url: `${SITE}/`,
  image: `${SITE}/assets/portrait.webp`,
  jobTitle: ui[locale].role,
  email: `mailto:${EMAIL}`,
  sameAs: [GITHUB, LINKEDIN],
  alumniOf: { '@type': 'CollegeOrUniversity', name: cv[locale].school.name },
  knowsLanguage: ['tr', 'en'],
  // The stack as the CV lists it, without the notes in parentheses.
  knowsAbout: [...new Set(cv.en.skills.flatMap(([, v]) => v.split(/,\s*(?![^()]*\))/).map((s) => s.replace(/ \(.*\)$/, ''))))],
});

export const homeSchema = (locale: Locale) => ({
  '@context': 'https://schema.org',
  '@graph': [
    person(locale),
    { '@type': 'WebSite', '@id': WEBSITE, url: `${SITE}/`, name: 'İzzet Can Öztozlu', inLanguage: ['en', 'tr'], publisher: { '@id': PERSON } },
    {
      '@type': 'ProfilePage',
      '@id': `${url(locale, '/')}#page`,
      url: url(locale, '/'),
      name: ui[locale].title,
      description: ui[locale].description,
      inLanguage: locale,
      isPartOf: { '@id': WEBSITE },
      mainEntity: { '@id': PERSON },
    },
  ],
});

export const projectSchema = (locale: Locale, p: Project, image: string) => {
  const page = url(locale, `/projects/${p.id}`);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareSourceCode',
        '@id': `${page}#project`,
        name: p.name,
        description: p.desc,
        url: page,
        image,
        inLanguage: locale,
        programmingLanguage: p.lang,
        ...(p.repo && { codeRepository: `${GITHUB}/${p.repo}` }),
        ...(p.home && { sameAs: p.home }),
        author: { '@type': 'Person', '@id': PERSON, name: 'İzzet Can Öztozlu', url: `${SITE}/` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: ui[locale].home, item: url(locale, '/') },
          { '@type': 'ListItem', position: 2, name: p.name, item: page },
        ],
      },
    ],
  };
};
