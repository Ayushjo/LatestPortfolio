import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/writing';
import { profile } from '../content/profile';

export async function GET(context: APIContext) {
  const posts = (await getPosts()).filter((p) => !p.data.draft);
  return rss({
    title: `${profile.name} — Writing`,
    description: 'Notes on systems, storage engines, proxies and agents.',
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.summary,
      link: `/writing/${p.id}/`,
    })),
  });
}
