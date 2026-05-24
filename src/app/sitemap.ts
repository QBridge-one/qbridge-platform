import type { MetadataRoute } from "next";
import { MARKETING_SITEMAP_PATHS } from "@/lib/marketing/routes";
import { siteUrl } from "@/lib/marketing/site-url";
import { INSIGHT_CATEGORIES } from "@/content/insights/categories";
import { insightPosts } from "@/content/insights/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const marketing: MetadataRoute.Sitemap = MARKETING_SITEMAP_PATHS.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/insights" ? "weekly" : "monthly",
    priority:
      path === ""
        ? 1
        : path === "/insights"
          ? 0.9
          : path === "/contact" || path === "/about"
            ? 0.9
            : 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = INSIGHT_CATEGORIES.map((c) => ({
    url: `${siteUrl}/insights/category/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const posts: MetadataRoute.Sitemap = insightPosts.map((p) => ({
    url: `${siteUrl}/insights/${p.metadata.slug}`,
    lastModified: new Date(
      `${p.metadata.updatedAt ?? p.metadata.publishedAt}T00:00:00Z`,
    ),
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [...marketing, ...categoryPages, ...posts];
}
