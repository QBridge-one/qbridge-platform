import type { Metadata } from "next";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { MarketingPageIntro } from "@/components/landing/marketing-page-intro";
import { ComplianceArch } from "@/components/landing/compliance-arch";
import { HowItWorks } from "@/components/landing/how-it-works";

export const metadata: Metadata = {
  title: "Compliance — QBridge",
  description:
    "Learn how QBridge embeds regulatory logic at the protocol layer with multi-jurisdiction support, privacy-preserving verification, and examination-ready audit trails.",
};

export default function CompliancePage() {
  return (
    <MarketingShell>
      <main>
        <MarketingPageIntro
          label="Compliance"
          title="Regulatory logic built into the protocol layer."
          description="QBridge is designed for institutions that cannot treat compliance as an afterthought. Rule sets, identity controls, and auditability are native to the infrastructure — not bolted on through middleware."
        />
        <ComplianceArch />
        <HowItWorks />
      </main>
    </MarketingShell>
  );
}
