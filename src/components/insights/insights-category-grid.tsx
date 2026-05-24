import Link from "next/link";
import { INSIGHT_CATEGORIES } from "@/content/insights/categories";

/**
 * Topic-browsing grid. Evergreen — always renders well even when there are
 * few posts, because it advertises the editorial scope, not specific articles.
 */
export function InsightsCategoryGrid() {
  return (
    <section className="qb-section qb-section--navy-mid">
      <div className="qb-section-shell">
        <div className="qb-section-label">Browse by Topic</div>
        <div className="qb-cat-grid">
          {INSIGHT_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/insights/category/${cat.slug}`}
              className="qb-cat-card"
              aria-label={`Browse ${cat.label} insights`}
            >
              <h3 className="qb-cat-card-name">{cat.label}</h3>
              <p className="qb-cat-card-desc">{cat.description}</p>
              <span className="qb-cat-card-cta">Browse →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
