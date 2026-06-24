import rss from '@astrojs/rss';
import { getPublishedPosts } from '../utils/posts';

/** English blog feed — for feed readers and discovery. */
export async function GET(context) {
  const posts = await getPublishedPosts('en');
  return rss({
    title: 'Mizolutions — Blog',
    description:
      'Deep-dive engineering write-ups on reliability, SRE, FinOps, data and research, mined from the Trinitrade project.',
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `/blog/${p.id}`,
      categories: p.data.tags,
    })),
    customData: `<language>en-us</language>`,
  });
}
