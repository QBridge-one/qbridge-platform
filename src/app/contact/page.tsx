import type { Metadata } from "next";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { CTA } from "@/components/landing/cta";

export const metadata: Metadata = {
  title: "Contact — QBridge",
  description:
    "Contact QBridge to discuss compliant digital asset infrastructure for your institution. Access is by application for regulated financial institutions and asset managers.",
};

export default function ContactPage() {
  return (
    <MarketingShell>
      <main>
        <CTA />
      </main>
    </MarketingShell>
  );
}
