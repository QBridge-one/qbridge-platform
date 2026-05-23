import { LandingStructuredData } from "@/components/landing/landing-structured-data";
import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";
import { T } from "@/components/landing/shared";

interface MarketingShellProps {
  children: React.ReactNode;
  /** Show the dev-setup banner (homepage only). */
  banner?: React.ReactNode;
}

export function MarketingShell({ children, banner }: MarketingShellProps) {
  return (
    <>
      <LandingStructuredData />
      <div style={{ background: T.navy, minHeight: "100vh", color: T.coldW }}>
        {banner}
        <Nav />
        {children}
        <Footer />
      </div>
    </>
  );
}
