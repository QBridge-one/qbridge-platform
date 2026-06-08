// ============================================================
// app/ops/admin/permissions/page.tsx
// Platform permissions — wire singleton-contract functions to
// PlatformAccessManager roles. Ops-only; on-chain SUPER_ADMIN enforces.
// ============================================================

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { can } from "@/lib/auth/permissions";
import { PermissionsManager } from "@/components/ops/PermissionsManager";

export default async function OpsPermissionsPage() {
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
        <h1 className="text-2xl font-bold tracking-tight">Platform permissions</h1>
        <p className="text-sm text-muted-foreground">
          Configure which on-chain role may call each platform-contract function
          (AccessManager <code className="text-xs">setTargetFunctionRole</code>).
          Off-chain role membership is managed under Team &amp; access.
        </p>
      </header>

      <div className="max-w-2xl">
        <PermissionsManager />
      </div>
    </div>
  );
}
