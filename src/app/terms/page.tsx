import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { LegalHeading, LegalPageContent, LegalParagraph } from "@/components/landing/legal-page-content";
import { T } from "@/components/landing/shared";

export const metadata: Metadata = {
  title: "Terms of Use — QBridge",
  description: "QBridge terms of use for institutional digital asset infrastructure services.",
};

export default function TermsPage() {
  return (
    <MarketingShell>
      <main>
        <LegalPageContent label="Legal" title="Terms of Use">
          <LegalParagraph>
            These terms govern access to QBridge marketing materials and institutional platform
            services. QBridge is not a retail investment product and is intended exclusively for
            regulated institutions and qualified market participants.
          </LegalParagraph>
          <LegalHeading>Eligibility</LegalHeading>
          <LegalParagraph>
            Access to QBridge infrastructure is subject to institutional onboarding, compliance
            review, and applicable regulatory requirements in your jurisdiction.
          </LegalParagraph>
          <LegalHeading>Platform use</LegalHeading>
          <LegalParagraph>
            You agree to use QBridge services only for lawful institutional purposes and in
            accordance with applicable securities, banking, and anti-money laundering regulations.
          </LegalParagraph>
          <LegalHeading>Contact</LegalHeading>
          <LegalParagraph>
            Questions about these terms may be submitted through our{" "}
            <Link href="/contact" style={{ color: T.accent }}>Contact</Link> page.
          </LegalParagraph>
        </LegalPageContent>
      </main>
    </MarketingShell>
  );
}
