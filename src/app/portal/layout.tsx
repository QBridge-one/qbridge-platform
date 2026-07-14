// ============================================================
// app/portal/layout.tsx — Client (token-holder) portal shell (/portal)
// Server component. The client plane: a corporate treasury holder's view of
// their tokenized deposits — distinct from /ops (operator) and /workspace
// (issuer).
//
// Gate is intentionally LEAN: a holder is any authenticated user. Unlike the
// issuer/ops planes there is no org-kind or KYB check here — a token holder
// need not own an issuer or ops organization. (When per-client roles are
// introduced, tighten this the way the other planes gate on appRoles.)
// ============================================================

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { PortalDashboardShell } from "@/components/dashboard/portal-dashboard-shell";

export const metadata: Metadata = {
  title: {
    template: "%s — QBridge Portal",
    default: "QBridge Portal",
  },
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const clientName =
    session.activeOrg?.name ?? session.user.displayName ?? "Treasury Client";

  return (
    <PortalDashboardShell
      clientName={clientName}
      linkedAddress={session.user.primaryWallet}
    >
      {children}
    </PortalDashboardShell>
  );
}
