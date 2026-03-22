// ============================================================
// app/dashboard/layout.tsx
// Shell layout for all dashboard pages
// Wraps content with sidebar + top nav bar
// ============================================================

import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardHeaderAccount } from "@/components/dashboard/dashboard-header-account";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s — QBridge Issuer Dashboard",
    default: "QBridge Issuer Dashboard",
  },
};

// ─── In real usage, get session server-side via NextAuth ──────
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// const session = await getServerSession(authOptions);
// For now we pass mock props — replace with real session data

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar ── */}
      {/* 
        Replace hardcoded props with session data:
        platformRole={session?.user?.platformRole}
        walletAddress={session?.user?.address}
        issuerName={session?.user?.name ?? "My Workspace"}
      */}
      <Sidebar
        platformRole="ADMIN"
        walletAddress="0xC3D4533949D52ee67447c87F40c8b98092FD1dF1"
        issuerName="Acme Capital Ltd."
      />

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ── Top bar ── */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-card px-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assets, investors…"
              className="pl-9 h-9 bg-background"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Network badge */}
            <Badge variant="outline" className="text-xs gap-1.5 hidden sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Ethereum Sepolia
            </Badge>

            <Separator orientation="vertical" className="h-6" />

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
              <span className="sr-only">Notifications</span>
            </Button>

            {/* Wallet / logout (Web3Auth + wagmi) */}
            <DashboardHeaderAccount />
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
