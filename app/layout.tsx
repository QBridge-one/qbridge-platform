import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qbridge.one";

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
        url: "/og-image.png",
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
    images: ["/og-image.png"],
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
