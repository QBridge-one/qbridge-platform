// ============================================================
// app/ops/layout.tsx — QBridge internal ops shell (/ops)
// Server component. Performs auth + plane check before render.
// ============================================================

import { OpsSidebar } from "@/components/dashboard/ops-sidebar";
import { WalletStatus } from "@/components/wallet/wallet-status";
import { IdentityControls } from "@/components/dashboard/identity-controls";
import { ModeToggle } from "@/components/dashboard/mode-toggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
    <div className="flex min-h-screen bg-background">
      <OpsSidebar
        platformRole="PLATFORM_ADMIN"
        walletAddress="0xC3D4533949D52ee67447c87F40c8b98092FD1dF1"
        operatorName={session.activeOrg.name ?? "QBridge Operations"}
        appRoles={session.appRoles}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-card px-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search issuers, flags, activity…"
              className="pl-9 h-9 bg-background"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Badge variant="outline" className="text-xs gap-1.5 hidden sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Ops · Sepolia
            </Badge>

            <Separator orientation="vertical" className="h-6" />

            <NotificationBell />

            <ModeToggle />

            <WalletStatus linkedAddress={session.user.primaryWallet} />
            <IdentityControls />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
