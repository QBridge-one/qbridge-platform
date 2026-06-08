// ============================================================
// app/ops/admin/factory/page.tsx
// Deal factory status + pause/unpause controls. Ops-only; on-chain
// AccessManager enforces who may pause.
// ============================================================

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { can } from "@/lib/auth/permissions";
import { FactoryStatusPanel } from "@/components/ops/FactoryStatusPanel";

export default async function OpsFactoryPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!session.activeOrg || session.activeOrg.kind !== "ops") {
    redirect("/select-workspace");
  }
  if (!can(session.appRoles, "ops:contracts:deploy")) {
    redirect("/ops");
  }

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Deal factory</h1>
        <p className="text-sm text-muted-foreground">
          Live factory status and emergency pause/unpause for new deal deployments.
        </p>
      </header>

      <div className="max-w-2xl">
        <FactoryStatusPanel />
      </div>
    </div>
  );
}
