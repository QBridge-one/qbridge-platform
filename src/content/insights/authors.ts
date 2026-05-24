import type { InsightAuthor } from "./types";

/**
 * Author profiles used across QBridge Insights.
 *
 * Adding a new author? Add an entry here and reference it from posts.
 * Posts should NEVER hardcode author details — keeping bylines consistent
 * across an editorial archive matters for both reader trust and structured
 * data (Article schema).
 */

export const SHAHLA_NIKBAKHT: InsightAuthor = {
  name: "Shahla Nikbakht",
  role: "Founder & Protocol Architect, QBridge",
};

/** The default author for posts that don't specify one explicitly. */
export const DEFAULT_AUTHOR: InsightAuthor = SHAHLA_NIKBAKHT;
