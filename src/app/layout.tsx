import type { Metadata } from "next";
import "./globals.css";
import { Web3AuthProviders } from "@/components/providers/web3auth-providers";
import { IdentityProvider } from "@/components/providers/identity-provider";
import { AppToaster } from "@/components/providers/app-toaster";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { themeFontClassName } from "@/lib/theme/fonts";
import { siteUrl } from "@/lib/marketing/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "QBridge — Compliant Digital Asset Infrastructure",
  description:
    "Institutional-grade blockchain rails for real-world asset tokenization with compliance, identity controls, and auditability built into the protocol layer.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
  },
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
    <html lang="en" suppressHydrationWarning className={themeFontClassName}>
      <head>
        {process.env.NEXT_PUBLIC_FB_APP_ID && (
          <meta property="fb:app_id" content={process.env.NEXT_PUBLIC_FB_APP_ID} />
        )}
        {/* Landing page fonts — marketing site only; see src/components/landing/ */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <IdentityProvider>
            <Web3AuthProviders>
              <TooltipProvider>
                {children}
                <AppToaster />
              </TooltipProvider>
            </Web3AuthProviders>
          </IdentityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
