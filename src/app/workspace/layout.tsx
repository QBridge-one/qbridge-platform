// ============================================================
// app/workspace/layout.tsx — Issuer workspace shell (/workspace)
// Server component. Performs auth + plane check before render.
// ============================================================

import { WorkspaceDashboardShell } from "@/components/dashboard/workspace-dashboard-shell";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { can } from "@/lib/auth/permissions";
import { issuerWorkspaceKybBlocks } from "@/lib/core/issuer-kyb";

export const metadata: Metadata = {
  title: {
    template: "%s — QBridge Workspace",
    default: "QBridge Workspace",
  },
};

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!session.activeOrg) redirect("/select-workspace");
  if (session.activeOrg.kind !== "issuer") redirect("/select-workspace");
  if (issuerWorkspaceKybBlocks(session.activeOrg.kind, session.activeOrg.kybStatus)) {
    redirect("/onboarding/kyb");
  }
  if (!can(session.appRoles, "workspace:view")) redirect("/select-workspace");

  return (
    <WorkspaceDashboardShell
      walletAddress="0xC3D4533949D52ee67447c87F40c8b98092FD1dF1"
      issuerName={session.activeOrg.name ?? "Issuer Workspace"}
      appRoles={session.appRoles}
      linkedAddress={session.user.primaryWallet}
    >
      {children}
    </WorkspaceDashboardShell>
  );
}
