import type { Metadata } from "next";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { MarketingPageIntro } from "@/components/landing/marketing-page-intro";
import { WhyQBridge } from "@/components/landing/why-qbridge";
import { Problem } from "@/components/landing/problem";

export const metadata: Metadata = {
  title: "About — QBridge",
  description:
    "QBridge builds institutional-grade blockchain infrastructure for regulated digital asset programs — purpose-built for compliance, governance, and multi-jurisdiction operations.",
};

export default function AboutPage() {
  return (
    <MarketingShell>
      <main>
        <MarketingPageIntro
          label="About QBridge"
          title="Infrastructure for regulated institutions."
          description="QBridge does not adapt retail blockchain tools for institutional use. We architect compliant digital asset rails specifically for the governance, audit, and scalability demands of regulated capital markets."
        />
        <Problem />
        <WhyQBridge />
      </main>
    </MarketingShell>
  );
}
