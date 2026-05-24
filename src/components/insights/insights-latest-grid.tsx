import Link from "next/link";
import { getCategory } from "@/content/insights/categories";
import type { InsightPost } from "@/content/insights/types";
import { formatInsightDate } from "@/lib/marketing/insights-date";

interface InsightsLatestGridProps {
  posts: ReadonlyArray<InsightPost>;
}

/**
 * Grid of recent posts (excluding the one rendered in <InsightsHero/>).
 *
 * - 2-column on desktop, 1-column on mobile.
 * - If only one post remains it renders full-width so the layout doesn't
 *   look half-empty.
 * - If there are zero remaining posts the whole section is omitted by
 *   returning null — never render an empty "Latest" header.
 */
export function InsightsLatestGrid({ posts }: InsightsLatestGridProps) {
  if (posts.length === 0) return null;

  return (
    <section className="qb-section qb-section--navy">
      <div className="qb-section-shell">
        <div className="qb-section-label">Latest Insights</div>
        <div className={`qb-grid${posts.length === 1 ? " qb-grid--single" : ""}`}>
          {posts.map((post) => {
            const cat = getCategory(post.metadata.category);
            return (
              <Link
                key={post.metadata.slug}
                href={`/insights/${post.metadata.slug}`}
                className="qb-grid-card"
              >
                <div className="qb-grid-card-meta">
                  {cat && <span className="qb-grid-card-cat">{cat.label}</span>}
                  <span className="qb-grid-card-date">
                    {formatInsightDate(post.metadata.publishedAt)}
                  </span>
                  <span className="qb-grid-card-read">
                    {post.metadata.readMinutes} min
                  </span>
                </div>
                <h3 className="qb-grid-card-title">{post.metadata.title}</h3>
                <p className="qb-grid-card-desc">{post.metadata.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
