// ============================================================
// app/portal/page.tsx — Client portal overview (server)
// Resolves the session for the holder's name + linked wallet, then renders
// the interactive treasury dashboard.
// ============================================================

import { getSession } from "@/lib/auth/server";
import { PortalDashboard } from "./_components/portal-dashboard";

export default async function PortalPage() {
  const session = await getSession();
  const clientName =
    session?.activeOrg?.name ?? session?.user.displayName ?? "Treasury Client";

  return (
    <PortalDashboard
      clientName={clientName}
      linkedAddress={session?.user.primaryWallet ?? null}
    />
  );
}
