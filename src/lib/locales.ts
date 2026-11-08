/* Every page is built twice: English at its address, Turkish under an internal prefix that only the language
   Worker reads (src/worker.ts). Visitors never see the prefix. */
export const TR_PREFIX = '/__tr';
/** For getStaticPaths. New objects on every call: Astro changes the ones it is given. */
export const localePaths = () => [{ params: { locale: undefined } }, { params: { locale: '__tr' } }];
