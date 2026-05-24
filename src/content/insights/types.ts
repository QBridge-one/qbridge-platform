import type { ComponentType } from "react";

/**
 * Editorial categories for QBridge Insights.
 * Keep this list tight — topical authority comes from depth, not breadth.
 * Adding a new category? Add it here AND to INSIGHT_CATEGORIES.
 */
export type InsightCategory =
  | "regulation"
  | "market"
  | "tokenization"
  | "compliance"
  | "product";

export interface InsightAuthor {
  /** Display name, e.g. "Shahla Nikbakht" */
  name: string;
  /** Optional role/title shown under the byline */
  role?: string;
  /** Optional external URL (LinkedIn etc.) for the author chip */
  url?: string;
}

export interface InsightMetadata {
  /** URL slug — must match the filename and be unique. Lowercase kebab-case. */
  slug: string;
  /** Page title (also <h1>). Keep under ~70 chars for SERPs. */
  title: string;
  /** SEO meta description. 140–160 chars ideal. */
  description: string;
  /** ISO date string, e.g. "2026-05-23". Used in sitemap + Article schema. */
  publishedAt: string;
  /** Optional ISO date for last update; falls back to publishedAt. */
  updatedAt?: string;
  category: InsightCategory;
  /** Free-form tags used for related-post discovery and on-page chips. */
  tags: string[];
  author: InsightAuthor;
  /** Estimated read time in minutes. */
  readMinutes: number;
  /** Optional 1200x630 OG/social image path under /public. */
  ogImage?: string;
  /** If true, the post is hidden from listings, RSS, and sitemap. */
  draft?: boolean;
}

export interface InsightPost {
  metadata: InsightMetadata;
  /** Server component that renders the post body using the helpers in _ui.tsx */
  Body: ComponentType;
}
