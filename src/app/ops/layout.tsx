// ============================================================
// app/ops/layout.tsx — QBridge internal ops shell (/ops)
// Server component. Performs auth + plane check before render.
// ============================================================

import { OpsDashboardShell } from "@/components/dashboard/ops-dashboard-shell";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { can } from "@/lib/auth/permissions";

export const metadata: Metadata = {
  title: {
    template: "%s — QBridge Ops",
    default: "QBridge Ops",
  },
};

export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!session.activeOrg) redirect("/select-workspace");
  if (session.activeOrg.kind !== "ops") redirect("/select-workspace");
  if (!can(session.appRoles, "ops:view")) redirect("/select-workspace");

  return (
    <OpsDashboardShell
      platformRole="PLATFORM_ADMIN"
      walletAddress="0xC3D4533949D52ee67447c87F40c8b98092FD1dF1"
      operatorName={session.activeOrg.name ?? "QBridge Operations"}
      appRoles={session.appRoles}
      linkedAddress={session.user.primaryWallet}
    >
      {children}
    </OpsDashboardShell>
  );
}
