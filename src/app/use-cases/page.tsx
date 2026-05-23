import type { Metadata } from "next";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { MarketingPageIntro } from "@/components/landing/marketing-page-intro";
import { UseCases } from "@/components/landing/use-cases";

export const metadata: Metadata = {
  title: "Use Cases — QBridge",
  description:
    "See how regulated institutions use QBridge for tokenized funds, private credit, real-world assets, and cross-border capital markets programs.",
};

export default function UseCasesPage() {
  return (
    <MarketingShell>
      <main>
        <MarketingPageIntro
          label="Use Cases"
          title="Digital asset programs for regulated capital markets."
          description="From tokenized fund shares to structured credit and real-world asset programs, QBridge supports institutional use cases that require compliance, governance, and scale from day one."
        />
        <UseCases />
      </main>
    </MarketingShell>
  );
}
