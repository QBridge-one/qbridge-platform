import type { Metadata } from "next";
import "./globals.css";

// Must match your canonical domain. Vercel redirects qbridge.one → www, so use www
// so og:image returns 200 (crawlers often don't follow redirects for images).
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.qbridge.one";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "QBridge — Compliant Digital Asset Infrastructure",
  description:
    "Institutional-grade blockchain rails for real-world asset tokenization with compliance, identity controls, and auditability built into the protocol layer.",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "QBridge",
    title: "QBridge — Compliant Digital Asset Infrastructure",
    description:
      "Institutional-grade blockchain rails for real-world asset tokenization with compliance, identity controls, and auditability built into the protocol layer.",
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "QBridge — Institutional digital asset infrastructure",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QBridge — Compliant Digital Asset Infrastructure",
    description:
      "Institutional-grade blockchain rails for real-world asset tokenization with compliance, identity controls, and auditability built into the protocol layer.",
    images: [`${siteUrl}/og-image.jpg`],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {process.env.NEXT_PUBLIC_FB_APP_ID && (
          <meta property="fb:app_id" content={process.env.NEXT_PUBLIC_FB_APP_ID} />
        )}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
