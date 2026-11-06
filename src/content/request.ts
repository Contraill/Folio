/* The content a request renders from, read once per request from the store. */
import { env } from 'cloudflare:workers';
import type { Locale } from '../i18n/locale.ts';
import { type Content, loadContent } from './store.ts';

const store = () => {
  if (!env.DB) throw new Error('No content store is bound in this environment');
  return env.DB;
};

export const getContent = (locals: App.Locals): Promise<Content> => (locals.content ??= loadContent(store(), locals.locale));

/** Content in a language other than the request's, for the CV's own language switch. */
export const contentIn = (locals: App.Locals, locale: Locale) => (locale === locals.locale ? getContent(locals) : loadContent(store(), locale));
