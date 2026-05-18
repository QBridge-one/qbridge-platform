// ============================================================
// app/workspace/onboarding/page.tsx
// Issuer onboarding hub — the journey view shown inside the
// workspace shell. The layout already ensures the org is approved
// (otherwise the issuer is sent back to /onboarding/kyb), so this
// page primarily shows where step 1 landed and what's next.
// ============================================================

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { can } from "@/lib/auth/permissions";
import { OnboardingHub } from "@/components/workspace/OnboardingHub";

export default async function WorkspaceOnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!session.activeOrg || session.activeOrg.kind !== "issuer") {
    redirect("/select-workspace");
  }
  if (!can(session.appRoles, "workspace:view")) {
    redirect("/workspace");
  }
  return <OnboardingHub org={session.activeOrg} />;
}
