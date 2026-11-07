/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    locale: import('./i18n/locale').Locale;
    /** The page's address without the internal Turkish prefix: what visitors see. */
    path: string;
    /** Set when this page shows English text in place of a missing Turkish one. */
    fallback?: boolean;
  }
}

/** The route list `scripts/postbuild.ts` writes for the language Worker, declared so type checks need no build. */
declare module '*/.folio/routes.json' {
  const routes: import('./lib/language-worker').Routes;
  export default routes;
}
