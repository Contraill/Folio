/* Content collections. Files are checked against src/content/schema.ts by src/content/load.ts, which keeps them as
   written; a file that doesn't fit stops the build. */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

export const collections = {
  pages: defineCollection({ loader: glob({ pattern: '*/{en,tr}.md', base: './src/content/pages' }) }),
  projects: defineCollection({ loader: glob({ pattern: '*/{en,tr}.md', base: './src/content/projects' }) }),
};
