import type { InsightCategory } from "./types";

interface CategoryDefinition {
  slug: InsightCategory;
  label: string;
  /** Short blurb used on the category landing page and for SEO meta description. */
  description: string;
}

export const INSIGHT_CATEGORIES: ReadonlyArray<CategoryDefinition> = [
  {
    slug: "regulation",
    label: "Regulation",
    description:
      "Tracking the rules shaping tokenized capital markets — MiCA, SEC, MAS, DFSA, FCA, and the bilateral frameworks moving fastest in 2026.",
  },
  {
    slug: "market",
    label: "Market",
    description:
      "Market structure, capital flows, issuance trends, and adoption signals across tokenized funds, private credit, and real-world assets.",
  },
  {
    slug: "tokenization",
    label: "Tokenization",
    description:
      "How regulated assets get on-chain — issuance models, token standards, lifecycle operations, and what actually works at institutional scale.",
  },
  {
    slug: "compliance",
    label: "Compliance",
    description:
      "Identity, transfer controls, sanctions screening, audit, and the operational mechanics of running a compliant digital asset program.",
  },
  {
    slug: "product",
    label: "Product",
    description:
      "Product updates, capability deep-dives, and behind-the-scenes notes on what we're shipping at QBridge.",
  },
] as const;

export function getCategory(slug: string): CategoryDefinition | undefined {
  return INSIGHT_CATEGORIES.find((c) => c.slug === slug);
}
