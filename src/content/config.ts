import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    lang: z.enum(['en', 'es']),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    /**
     * Optional pre-written hook used by the social automation (LinkedIn + X,
     * English only). When present, the scheduler drafts this instead of an
     * auto-generated title+description. See docs/control/BLOG_PLAN.md §automation.
     */
    socialEN: z.string().optional(),
  }),
});

export const collections = { blog };
