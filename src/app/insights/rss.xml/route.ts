import { insightPosts } from "@/content/insights/registry";
import { siteUrl } from "@/lib/marketing/site-url";

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const lastBuild = new Date().toUTCString();

  const items = insightPosts
    .map((p) => {
      const url = `${siteUrl}/insights/${p.metadata.slug}`;
      const pubDate = new Date(`${p.metadata.publishedAt}T00:00:00Z`).toUTCString();
      return `    <item>
      <title>${escapeXml(p.metadata.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(p.metadata.description)}</description>
      <category>${escapeXml(p.metadata.category)}</category>
      <author>noreply@qbridge.one (${escapeXml(p.metadata.author.name)})</author>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>QBridge Insights</title>
    <link>${siteUrl}/insights</link>
    <atom:link href="${siteUrl}/insights/rss.xml" rel="self" type="application/rss+xml" />
    <description>Regulation, market structure, and operational notes from QBridge — compliant tokenization infrastructure for institutions.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
