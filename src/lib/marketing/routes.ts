export const MARKETING_NAV = [
  { label: "Platform", href: "/platform" },
  { label: "Compliance", href: "/compliance" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Insights", href: "/insights" },
  { label: "About", href: "/about" },
] as const;

export const MARKETING_FOOTER = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use", href: "/terms" },
  { label: "Contact", href: "/contact" },
] as const;

/**
 * Public marketing URLs included in sitemap.xml.
 *
 * Insight posts and category pages are added dynamically in `sitemap.ts`
 * from the insights registry, so they don't need to be listed here.
 */
export const MARKETING_SITEMAP_PATHS = [
  "",
  "/platform",
  "/compliance",
  "/use-cases",
  "/insights",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
] as const;
