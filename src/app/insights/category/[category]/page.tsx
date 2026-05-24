import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { MarketingPageIntro } from "@/components/landing/marketing-page-intro";
import { InsightsListing } from "@/components/insights/insights-listing";
import { INSIGHT_CATEGORIES, getCategory } from "@/content/insights/categories";
import { getInsightsByCategory } from "@/content/insights/registry";
import { siteUrl } from "@/lib/marketing/site-url";
import "../../insights.css";

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return INSIGHT_CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return {};
  return {
    title: `${cat.label} — QBridge Insights`,
    description: cat.description,
    alternates: { canonical: `${siteUrl}/insights/category/${cat.slug}` },
    openGraph: {
      type: "website",
      url: `${siteUrl}/insights/category/${cat.slug}`,
      title: `${cat.label} — QBridge Insights`,
      description: cat.description,
    },
  };
}

export default async function InsightCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();
  const posts = getInsightsByCategory(cat.slug);

  return (
    <MarketingShell>
      <main>
        <MarketingPageIntro
          label={`Insights / ${cat.label}`}
          title={`${cat.label}.`}
          description={cat.description}
        />
        <InsightsListing
          posts={posts}
          activeCategory={cat.slug}
          emptyMessage="No posts in this category yet — check back soon."
        />
      </main>
    </MarketingShell>
  );
}
