import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

/* Project write-ups, one folder per project with en.md and tr.md (frontmatter only). tr.md holds just what is
   translated and is laid over en.md. */
export const collections = {
  projects: defineCollection({ loader: glob({ pattern: '*/{en,tr}.md', base: './src/content/projects' }) }),
};
