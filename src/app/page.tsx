import { redirect } from "next/navigation";
import { Nav } from "@/components/landing/nav";
import { DevSetupBanner } from "@/components/landing/dev-setup-banner";
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
import { getSession } from "@/lib/auth/server";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function QBridgeLanding({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  // Some Clerk invitation flows (especially older invites without a
  // redirectUrl) drop the user back at "/" with __clerk_ticket /
  // __clerk_status query params. Treat that as "post-accept, send to
  // workspace router". Also: any signed-in user landing on "/" should
  // go straight to /select-workspace rather than seeing marketing.
  const params = (await searchParams) ?? {};
  const hasClerkTicket =
    typeof params.__clerk_ticket === "string" || typeof params.__clerk_status === "string";
  if (hasClerkTicket) redirect("/select-workspace");

  const session = await getSession();
  if (session) redirect("/select-workspace");

  return (
    <>
      <DevSetupBanner />
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
