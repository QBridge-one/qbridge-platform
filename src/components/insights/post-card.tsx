import Link from "next/link";
import { T } from "@/components/landing/shared";
import { getCategory } from "@/content/insights/categories";
import type { InsightPost } from "@/content/insights/types";
import { formatInsightDate } from "@/lib/marketing/insights-date";

interface PostCardProps {
  post: InsightPost;
}

/**
 * Listing-row for an insight post. Used on /insights, category pages, and
 * the related-reading strip at the bottom of every post. Responsive styles
 * live in src/app/insights/insights.css (.qb-insight-card and friends).
 */
export function PostCard({ post }: PostCardProps) {
  const cat = getCategory(post.metadata.category);
  return (
    <Link
      href={`/insights/${post.metadata.slug}`}
      className="qb-insight-card"
      style={{
        display: "block",
        textDecoration: "none",
        padding: "28px 0",
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div
        className="qb-insight-card-meta"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 14,
          marginBottom: 12,
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        {cat && <span style={{ color: T.gold }}>{cat.label}</span>}
        <span style={{ color: T.muted }}>
          {formatInsightDate(post.metadata.publishedAt)}
        </span>
        <span className="qb-insight-card-sep" style={{ color: T.muted }}>
          ·
        </span>
        <span style={{ color: T.muted }}>{post.metadata.readMinutes} min read</span>
      </div>

      <h2
        className="qb-insight-card-title"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "clamp(20px, 2.8vw, 28px)",
          fontWeight: 700,
          lineHeight: 1.2,
          color: T.coldW,
          margin: "0 0 10px",
          transition: "color 0.2s",
        }}
      >
        {post.metadata.title}
      </h2>
      <p
        style={{
          fontSize: "clamp(14px, 1.6vw, 16px)",
          lineHeight: 1.65,
          color: T.muted,
          margin: 0,
          maxWidth: 720,
        }}
      >
        {post.metadata.description}
      </p>
    </Link>
  );
}
