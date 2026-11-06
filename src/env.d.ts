/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    locale: import('./i18n/locale').Locale;
    /** Loaded on first use; see src/content/request.ts. */
    content?: Promise<import('./content/store').Content>;
    /** Set by pages that are public and published, the only ones the shared cache may keep. */
    cacheable?: boolean;
  }
}
