import { getCollection } from 'astro:content';

/** Projects that have a case study at /work/<slug>/. */
export async function caseStudies(): Promise<Set<string>> {
  return new Set((await getCollection('work')).map((e) => e.id));
}
