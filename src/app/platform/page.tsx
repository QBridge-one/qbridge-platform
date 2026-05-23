import type { Metadata } from "next";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { MarketingPageIntro } from "@/components/landing/marketing-page-intro";
import { Capabilities } from "@/components/landing/capabilities";
import { Solution } from "@/components/landing/solution";
import { TechLayer } from "@/components/landing/tech-layer";

export const metadata: Metadata = {
  title: "Platform — QBridge",
  description:
    "Explore QBridge platform capabilities: compliant tokenization, identity controls, multi-jurisdiction rule sets, and institutional-grade digital asset infrastructure.",
};

export default function PlatformPage() {
  return (
    <MarketingShell>
      <main>
        <MarketingPageIntro
          label="Platform"
          title="Compliant infrastructure for regulated digital assets."
          description="QBridge delivers protocol-layer compliance, configurable jurisdiction rules, and audit-ready operations — built for asset managers, banks, and capital market operators."
        />
        <Capabilities />
        <Solution />
        <TechLayer />
      </main>
    </MarketingShell>
  );
}
