import Link from "next/link";
import { getCategory } from "@/content/insights/categories";
import type { InsightPost } from "@/content/insights/types";
import { formatInsightDate } from "@/lib/marketing/insights-date";

interface InsightsHeroProps {
  post: InsightPost;
}

/**
 * Featured post hero — the visual anchor of /insights. The most recent post
 * is promoted here so the first thing visitors see on the publication
 * landing page is original, dated commentary.
 */
export function InsightsHero({ post }: InsightsHeroProps) {
  const cat = getCategory(post.metadata.category);
  return (
    <section className="qb-section qb-section--navy-mid">
      <div className="qb-section-shell">
        <div className="qb-section-label">Featured</div>
        <Link
          href={`/insights/${post.metadata.slug}`}
          className="qb-featured"
          aria-label={`Read featured post: ${post.metadata.title}`}
        >
          <div className="qb-featured-meta">
            {cat && <span className="qb-featured-cat">{cat.label}</span>}
            <span className="qb-featured-sep">·</span>
            <span className="qb-featured-date">
              {formatInsightDate(post.metadata.publishedAt)}
            </span>
            <span className="qb-featured-sep">·</span>
            <span className="qb-featured-read">
              {post.metadata.readMinutes} min read
            </span>
          </div>
          <h2 className="qb-featured-title">{post.metadata.title}</h2>
          <p className="qb-featured-desc">{post.metadata.description}</p>
          <span className="qb-featured-cta">Read article →</span>
        </Link>
      </div>
    </section>
  );
}
