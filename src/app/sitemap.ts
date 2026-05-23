import type { MetadataRoute } from "next";
import { MARKETING_SITEMAP_PATHS } from "@/lib/marketing/routes";
import { siteUrl } from "@/lib/marketing/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return MARKETING_SITEMAP_PATHS.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/contact" || path === "/about" ? 0.9 : 0.8,
  }));
}
