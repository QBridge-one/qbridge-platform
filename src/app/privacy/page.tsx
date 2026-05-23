import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { LegalHeading, LegalPageContent, LegalParagraph } from "@/components/landing/legal-page-content";
import { T } from "@/components/landing/shared";

export const metadata: Metadata = {
  title: "Privacy Policy — QBridge",
  description: "QBridge privacy policy for institutional digital asset infrastructure services.",
};

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <main>
        <LegalPageContent label="Legal" title="Privacy Policy">
          <LegalParagraph>
            QBridge provides institutional digital asset infrastructure to regulated financial
            institutions and capital market operators. This policy describes how we handle information
            in connection with our platform and marketing communications.
          </LegalParagraph>
          <LegalHeading>Information we collect</LegalHeading>
          <LegalParagraph>
            We collect business contact information you submit through our website or onboarding
            process, usage data related to platform access, and compliance-related records required
            to operate regulated infrastructure services.
          </LegalParagraph>
          <LegalHeading>How we use information</LegalHeading>
          <LegalParagraph>
            We use collected information to evaluate institutional access requests, deliver and
            secure our services, meet regulatory obligations, and communicate about QBridge
            products relevant to your organization.
          </LegalParagraph>
          <LegalHeading>Contact</LegalHeading>
          <LegalParagraph>
            For privacy-related inquiries, contact us through the form on our{" "}
            <Link href="/contact" style={{ color: T.accent }}>Contact</Link> page.
          </LegalParagraph>
        </LegalPageContent>
      </main>
    </MarketingShell>
  );
}
