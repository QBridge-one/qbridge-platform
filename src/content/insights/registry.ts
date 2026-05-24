import type { InsightPost } from "./types";
import * as welcome from "./posts/welcome-to-qbridge-insights";
import * as secDelay from "./posts/sec-delays-tokenization-exemption-may-2026";

/**
 * Registry of all insight posts.
 *
 * To add a new post:
 *   1. Create `src/content/insights/posts/<slug>.tsx` exporting
 *      `metadata` and a default Body component.
 *   2. Import it here and add it to ALL_POSTS.
 *   3. That's it — listing, post page, sitemap, RSS, and category pages
 *      all pick it up automatically.
 */

function toPost(mod: { metadata: InsightPost["metadata"]; default: InsightPost["Body"] }): InsightPost {
  return { metadata: mod.metadata, Body: mod.default };
}

const ALL_POSTS: InsightPost[] = [toPost(welcome), toPost(secDelay)].filter(
  (p) => !p.metadata.draft,
);

/** Posts sorted newest first. Drafts are filtered out at registry level. */
export const insightPosts: ReadonlyArray<InsightPost> = [...ALL_POSTS].sort(
  (a, b) =>
    new Date(b.metadata.publishedAt).getTime() -
    new Date(a.metadata.publishedAt).getTime(),
);

export function getInsightBySlug(slug: string): InsightPost | undefined {
  return insightPosts.find((p) => p.metadata.slug === slug);
}

export function getInsightsByCategory(category: string): InsightPost[] {
  return insightPosts.filter((p) => p.metadata.category === category);
}

export function getRelatedInsights(
  slug: string,
  limit = 3,
): InsightPost[] {
  const current = getInsightBySlug(slug);
  if (!current) return [];
  const tagSet = new Set(current.metadata.tags);
  return insightPosts
    .filter((p) => p.metadata.slug !== slug)
    .map((p) => {
      const tagOverlap = p.metadata.tags.filter((t) => tagSet.has(t)).length;
      const sameCategory = p.metadata.category === current.metadata.category ? 1 : 0;
      return { post: p, score: tagOverlap * 2 + sameCategory };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (
        new Date(b.post.metadata.publishedAt).getTime() -
        new Date(a.post.metadata.publishedAt).getTime()
      );
    })
    .slice(0, limit)
    .map((entry) => entry.post);
}
