// ============================================================
// app/workspace/layout.tsx — Issuer workspace shell (/workspace)
// Server component. Performs auth + plane check before render.
// ============================================================

import { WorkspaceSidebar } from "@/components/dashboard/workspace-sidebar";
import { WalletStatus } from "@/components/wallet/wallet-status";
import { IdentityControls } from "@/components/dashboard/identity-controls";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
    <div className="flex min-h-screen bg-background">
      <WorkspaceSidebar
        walletAddress="0xC3D4533949D52ee67447c87F40c8b98092FD1dF1"
        issuerName={session.activeOrg.name ?? "Issuer Workspace"}
        appRoles={session.appRoles}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-card px-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assets, investors…"
              className="pl-9 h-9 bg-background"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Badge variant="outline" className="text-xs gap-1.5 hidden sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Ethereum Sepolia
            </Badge>

            <Separator orientation="vertical" className="h-6" />

            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
              <span className="sr-only">Notifications</span>
            </Button>

            <WalletStatus linkedAddress={session.user.primaryWallet} />
            <IdentityControls />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
