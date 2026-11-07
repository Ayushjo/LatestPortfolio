import { getCollection } from 'astro:content';
import { projects } from '../../content/projects';
import { thumbFor } from '../../lib/demos';

/** What scripts/og/card.html needs to draw each case study's share card. */
export async function GET() {
  const ids = new Set((await getCollection('work')).map((e) => e.id));
  const list = projects.filter((p) => ids.has(p.slug));
  const cards = list.map((p, i) => ({
    slug: p.slug,
    index: i + 1,
    total: list.length,
    name: p.name,
    tagline: p.tagline,
    stats: p.stats.slice(0, 3),
    thumb: thumbFor(p) ?? null,
  }));
  return new Response(JSON.stringify(cards, null, 2), { headers: { 'content-type': 'application/json' } });
}
