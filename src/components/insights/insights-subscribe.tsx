import { QBRIDGE_LINKEDIN_URL } from "@/lib/marketing/site-url";

/**
 * Subscribe / follow block at the bottom of /insights.
 *
 * Two affordances: LinkedIn (primary distribution channel) + RSS (machine-
 * readable, picked up by feed readers and AI crawlers). No email capture —
 * keeps the bar to subscribe low and aligns with the "we publish, we don't
 * spam" editorial posture.
 */
export function InsightsSubscribe() {
  return (
    <section className="qb-section qb-section--navy">
      <div className="qb-section-shell">
        <div className="qb-section-label">Stay Updated</div>
        <h2 className="qb-subscribe-title">
          New analysis on tokenization, the moment it ships.
        </h2>
        <p className="qb-subscribe-desc">
          Follow QBridge on LinkedIn for new posts, or subscribe to the RSS
          feed if you live in a reader.
        </p>
        <div className="qb-subscribe-actions">
          <a
            href={QBRIDGE_LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="qb-subscribe-btn qb-subscribe-btn--primary"
          >
            Follow on LinkedIn →
          </a>
          <a
            href="/insights/rss.xml"
            className="qb-subscribe-btn"
            type="application/rss+xml"
          >
            RSS Feed
          </a>
        </div>
      </div>
    </section>
  );
}
