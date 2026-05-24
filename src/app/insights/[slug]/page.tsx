import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { PostCard } from "@/components/insights/post-card";
import { getCategory } from "@/content/insights/categories";
import {
  getInsightBySlug,
  getRelatedInsights,
  insightPosts,
} from "@/content/insights/registry";
import { formatInsightDate } from "@/lib/marketing/insights-date";
import { siteUrl } from "@/lib/marketing/site-url";
import "../insights.css";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return insightPosts.map((p) => ({ slug: p.metadata.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getInsightBySlug(slug);
  if (!post) return {};
  const url = `${siteUrl}/insights/${post.metadata.slug}`;
  const ogImage = post.metadata.ogImage
    ? `${siteUrl}${post.metadata.ogImage}`
    : `${siteUrl}/og-image.jpg`;
  return {
    title: `${post.metadata.title} — QBridge Insights`,
    description: post.metadata.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.metadata.title,
      description: post.metadata.description,
      publishedTime: post.metadata.publishedAt,
      modifiedTime: post.metadata.updatedAt ?? post.metadata.publishedAt,
      authors: [post.metadata.author.name],
      tags: post.metadata.tags,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.metadata.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metadata.title,
      description: post.metadata.description,
      images: [ogImage],
    },
  };
}

export default async function InsightPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getInsightBySlug(slug);
  if (!post) notFound();

  const { Body, metadata: m } = post;
  const cat = getCategory(m.category);
  const related = getRelatedInsights(slug);
  const url = `${siteUrl}/insights/${m.slug}`;
  const ogImage = m.ogImage ? `${siteUrl}${m.ogImage}` : `${siteUrl}/og-image.jpg`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: m.title,
    description: m.description,
    datePublished: m.publishedAt,
    dateModified: m.updatedAt ?? m.publishedAt,
    author: { "@type": "Person", name: m.author.name },
    publisher: {
      "@type": "Organization",
      name: "QBridge",
      logo: { "@type": "ImageObject", url: `${siteUrl}/qbridge-logo.png` },
    },
    image: [ogImage],
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: cat?.label ?? m.category,
    keywords: m.tags.join(", "),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Insights", item: `${siteUrl}/insights` },
      ...(cat
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: cat.label,
              item: `${siteUrl}/insights/category/${cat.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: cat ? 4 : 3,
        name: m.title,
        item: url,
      },
    ],
  };

  return (
    <MarketingShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <article className="ip-article">
        <header className="ip-header">
          <div className="ip-shell">
            <nav aria-label="Breadcrumb" className="ip-crumbs">
              <Link href="/insights">Insights</Link>
              {cat && (
                <>
                  <span>/</span>
                  <Link href={`/insights/category/${cat.slug}`}>{cat.label}</Link>
                </>
              )}
            </nav>

            <h1 className="ip-title">{m.title}</h1>

            <div className="ip-meta">
              <span className="ip-author">{m.author.name}</span>
              {m.author.role && <span>{m.author.role}</span>}
              <span className="ip-sep">·</span>
              <time dateTime={m.publishedAt}>{formatInsightDate(m.publishedAt)}</time>
              <span className="ip-sep">·</span>
              <span>{m.readMinutes} min read</span>
            </div>
          </div>
        </header>

        <section className="ip-body">
          <div className="ip-shell">
            <Body />

            {m.tags.length > 0 && (
              <div className="ip-tags">
                {m.tags.map((tag) => (
                  <span key={tag} className="ip-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {related.length > 0 && (
          <section className="ip-related">
            <div className="ip-shell">
              <div className="ip-related-label">Related reading</div>
              <div>
                {related.map((p) => (
                  <PostCard key={p.metadata.slug} post={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </MarketingShell>
  );
}
