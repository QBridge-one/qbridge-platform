// ============================================================
// app/select-workspace/page.tsx
//
// Post-login destination. Decides where to send the user:
//  - 0 orgs           → redirect to Clerk's create-org / org-list page
//  - 1 ops org        → /ops
//  - 1 issuer org     → /workspace
//  - 1 active in session that matches above
//  - >1 with no active → render an org switcher
// ============================================================

import { redirect } from "next/navigation";
import { OrganizationList, OrganizationSwitcher } from "@clerk/nextjs";
import { getSession } from "@/lib/auth/server";
import { organizationAdapter } from "@/lib/container.server";

export default async function SelectWorkspacePage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  // If Clerk already has an active org for this session, route to its plane.
  if (session.activeOrg) {
    if (session.activeOrg.kind === "ops") redirect("/ops");
    redirect("/workspace");
  }

  // No active org — see what they belong to.
  const orgs = await organizationAdapter.listForUser(session.user.id);

  // No orgs at all → use Clerk's hosted "create organization" UI.
  if (orgs.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-lg space-y-4">
          <header className="space-y-1 text-center">
            <h1 className="text-xl font-medium tracking-tight">Create your workspace</h1>
            <p className="text-sm text-muted-foreground">
              Set up an organization to invite teammates and start issuing assets.
            </p>
          </header>
          <OrganizationList
            hidePersonal
            afterSelectOrganizationUrl="/select-workspace"
            afterCreateOrganizationUrl="/select-workspace"
          />
        </div>
      </main>
    );
  }

  // They have orgs but none active → show switcher.
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg space-y-4 text-center">
        <header className="space-y-1">
          <h1 className="text-xl font-medium tracking-tight">Choose a workspace</h1>
          <p className="text-sm text-muted-foreground">
            You belong to {orgs.length} organization{orgs.length === 1 ? "" : "s"}. Pick one to continue.
          </p>
        </header>
        <div className="flex justify-center">
          <OrganizationSwitcher
            hidePersonal
            afterSelectOrganizationUrl="/select-workspace"
            afterCreateOrganizationUrl="/select-workspace"
          />
        </div>
      </div>
    </main>
  );
}
