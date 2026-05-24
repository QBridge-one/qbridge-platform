import { CategoryChips } from "@/components/insights/category-chips";
import { PostCard } from "@/components/insights/post-card";
import type { InsightPost } from "@/content/insights/types";

interface InsightsListingProps {
  posts: ReadonlyArray<InsightPost>;
  activeCategory: "all" | string;
  emptyMessage?: string;
}

/**
 * Shared listing layout for /insights and /insights/category/[category].
 * All styles live in src/app/insights/insights.css (imported by the routes).
 */
export function InsightsListing({
  posts,
  activeCategory,
  emptyMessage = "No posts yet — check back soon.",
}: InsightsListingProps) {
  return (
    <section className="qb-insights-listing">
      <div className="qb-insights-shell">
        <CategoryChips active={activeCategory} />
        {posts.length === 0 ? (
          <p className="qb-insights-empty">{emptyMessage}</p>
        ) : (
          <div>
            {posts.map((post) => (
              <PostCard key={post.metadata.slug} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
