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
