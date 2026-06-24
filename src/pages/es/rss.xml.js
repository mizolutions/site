import rss from '@astrojs/rss';
import { getPublishedPosts } from '../../utils/posts';

/** Spanish blog feed — for feed readers and discovery. */
export async function GET(context) {
  const posts = await getPublishedPosts('es');
  return rss({
    title: 'Mizolutions — Blog (ES)',
    description:
      'Artículos técnicos a fondo sobre fiabilidad, SRE, FinOps, datos e investigación, extraídos del proyecto Trinitrade.',
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `/es/blog/${p.id}`,
      categories: p.data.tags,
    })),
    customData: `<language>es</language>`,
  });
}
