import { MARKETING_FOOTER, MARKETING_NAV } from "@/lib/marketing/routes";
import { siteUrl } from "@/lib/marketing/site-url";

export function LandingStructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "QBridge",
        url: siteUrl,
        logo: `${siteUrl}/qbridge-logo.png`,
        description:
          "Institutional-grade blockchain rails for real-world asset tokenization with compliance, identity controls, and auditability built into the protocol layer.",
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "QBridge",
        url: siteUrl,
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      ...MARKETING_NAV.map((item, index) => ({
        "@type": "SiteNavigationElement",
        "@id": `${siteUrl}/#nav-${index}`,
        name: item.label,
        url: `${siteUrl}${item.href}`,
      })),
      ...MARKETING_FOOTER.map((item, index) => ({
        "@type": "SiteNavigationElement",
        "@id": `${siteUrl}/#footer-${index}`,
        name: item.label,
        url: `${siteUrl}${item.href}`,
      })),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
