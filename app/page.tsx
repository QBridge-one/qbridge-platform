import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { Solution } from "@/components/landing/solution";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Capabilities } from "@/components/landing/capabilities";
import { ComplianceArch } from "@/components/landing/compliance-arch";
import { TechLayer } from "@/components/landing/tech-layer";
import { UseCases } from "@/components/landing/use-cases";
import { WhyQBridge } from "@/components/landing/why-qbridge";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function QBridgeLanding() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <HowItWorks />
        <Capabilities />
        <ComplianceArch />
        <TechLayer />
        <UseCases />
        <WhyQBridge />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
