import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/writing' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    /** Drafts show up in `pnpm dev` (marked) but never in a production build or the feed. */
    draft: z.boolean().default(false),
  }),
});

/**
 * Case studies, one per project (src/work/<project slug>.md). The project's name, tagline,
 * stats, links and demo come from src/content/projects.ts; these files add the depth.
 */
const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/work' }),
  schema: z.object({
    /** One paragraph: what it is and who it's for. */
    lede: z.string(),
    /** The problem, in a sentence or two. */
    problem: z.string(),
    /** The architecture as an ordered flow: each stage hands off to the next. */
    flow: z.array(z.object({ name: z.string(), detail: z.string() })).min(2),
    /** Decisions worth explaining, each with its reason. */
    decisions: z.array(z.object({ title: z.string(), why: z.string() })).default([]),
    /** Every number with the conditions it was measured under. */
    numbers: z.array(z.object({ value: z.string(), label: z.string(), note: z.string().optional() })).default([]),
    /** Ayush's part, when it was a team effort. */
    role: z.string().optional(),
    /** Built with (beyond the project's tags). */
    stack: z.array(z.string()).default([]),
    status: z.string().optional(),
    /** Where the facts on the page come from. */
    sources: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  }),
});

export const collections = { writing, work };
