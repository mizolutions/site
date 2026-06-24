import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export type Post = CollectionEntry<'blog'>;

/**
 * A post is publicly visible in **production** only when it is not a draft AND
 * its `pubDate` has arrived (≤ build time). Because the site is statically
 * built, "now" is the moment of the build — so a scheduled weekly rebuild is
 * what reveals each newly-due post (see .github/workflows/weekly-publish.yml).
 *
 * In dev (`npm run dev`) everything is shown, including drafts and future-dated
 * posts, so the operator can preview the full queue at localhost:4321.
 */
export function isPublished(data: Post['data']): boolean {
  if (!import.meta.env.PROD) return true;
  return data.draft !== true && data.pubDate.valueOf() <= Date.now();
}

/** All published posts (optionally for one language), newest first. */
export async function getPublishedPosts(lang?: Lang): Promise<Post[]> {
  const posts = await getCollection(
    'blog',
    ({ data }) => (lang ? data.lang === lang : true) && isPublished(data)
  );
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
