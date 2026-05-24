import type { Metadata } from "next";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { MarketingPageIntro } from "@/components/landing/marketing-page-intro";
import { InsightsHero } from "@/components/insights/insights-hero";
import { InsightsLatestGrid } from "@/components/insights/insights-latest-grid";
import { InsightsCategoryGrid } from "@/components/insights/insights-category-grid";
import { InsightsSubscribe } from "@/components/insights/insights-subscribe";
import { insightPosts } from "@/content/insights/registry";
import { siteUrl } from "@/lib/marketing/site-url";
import "./insights.css";

export const metadata: Metadata = {
  title: "Insights — QBridge",
  description:
    "Regulation, market structure, and operational notes from the team building compliant tokenization infrastructure at QBridge.",
  alternates: {
    canonical: `${siteUrl}/insights`,
    types: {
      "application/rss+xml": [
        { url: `${siteUrl}/insights/rss.xml`, title: "QBridge Insights RSS" },
      ],
    },
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/insights`,
    title: "Insights — QBridge",
    description:
      "Regulation, market structure, and operational notes from the team building compliant tokenization infrastructure at QBridge.",
  },
};

export default function InsightsIndexPage() {
  const [featured, ...rest] = insightPosts;

  return (
    <MarketingShell>
      <main>
        <MarketingPageIntro
          label="QBridge Insights"
          title="Notes from the compliant tokenization frontier."
          description="We publish our reading of the regulations, market structure, and operational realities of bringing regulated assets on-chain — written for institutions doing the work."
        />

        {featured && <InsightsHero post={featured} />}
        <InsightsLatestGrid posts={rest} />
        <InsightsCategoryGrid />
        <InsightsSubscribe />
      </main>
    </MarketingShell>
  );
}
