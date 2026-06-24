import rss from '@astrojs/rss';
import { getPublishedPosts } from '../utils/posts';
import { SITE } from '../consts';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Bilingual "weekly" feed consumed by Buttondown's RSS-to-email.
 * Each item is ONE logical post, pairing its EN and ES versions (matched by
 * shared `pubDate`), so subscribers get a single bilingual email per week:
 * English teaser on top, Spanish teaser below, each linking to the full post.
 */
export async function GET(context) {
  const all = await getPublishedPosts(); // both languages, newest first

  // Group by pubDate epoch → { en, es }
  const groups = new Map();
  for (const p of all) {
    const key = p.data.pubDate.valueOf();
    if (!groups.has(key)) groups.set(key, {});
    groups.get(key)[p.data.lang] = p;
  }

  const items = [...groups.values()]
    .map((pair) => {
      const primary = pair.en ?? pair.es;
      const enUrl = pair.en ? `${SITE.url}/blog/${pair.en.id}` : null;
      const esUrl = pair.es ? `${SITE.url}/es/blog/${pair.es.id}` : null;
      const parts = [];
      if (pair.en) {
        parts.push(
          `<p>${escapeHtml(pair.en.data.description)}</p>` +
            `<p><a href="${enUrl}">Read in English →</a></p>`
        );
      }
      if (pair.es) {
        parts.push(
          `<hr />` +
            `<p><strong>En español:</strong> ${escapeHtml(pair.es.data.description)}</p>` +
            `<p><a href="${esUrl}">Leer en español →</a></p>`
        );
      }
      return {
        title: primary.data.title,
        description: primary.data.description,
        pubDate: primary.data.pubDate,
        link: enUrl ?? esUrl,
        content: parts.join('\n'),
      };
    })
    .sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: 'Mizolutions — Weekly',
    description:
      'One new engineering deep-dive every week, in English and Spanish. From the Trinitrade project.',
    site: context.site,
    items,
  });
}
