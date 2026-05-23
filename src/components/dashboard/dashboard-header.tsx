"use client";

import type { Address } from "@/lib/core/types";
import { Menu, Search } from "lucide-react";
import { useDashboardNav } from "@/components/dashboard/dashboard-nav-context";
import { IdentityControls } from "@/components/dashboard/identity-controls";
import { ModeToggle } from "@/components/dashboard/mode-toggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { WalletStatus } from "@/components/wallet/wallet-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface NetworkBadge {
  label: string;
  dotClassName: string;
}

interface DashboardHeaderProps {
  searchPlaceholder: string;
  networkBadge: NetworkBadge;
  linkedAddress?: Address | null;
}

export function DashboardHeader({
  searchPlaceholder,
  networkBadge,
  linkedAddress = null,
}: DashboardHeaderProps) {
  const nav = useDashboardNav();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-3 sm:h-16 sm:gap-3 sm:px-4 md:px-6">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0 md:hidden"
        onClick={() => nav?.openNav()}
        aria-label="Open navigation menu"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="relative hidden min-w-0 flex-1 md:block md:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={searchPlaceholder} className="h-9 bg-background pl-9" />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
        <Badge variant="outline" className="hidden gap-1.5 text-xs lg:flex">
          <span className={`h-1.5 w-1.5 rounded-full ${networkBadge.dotClassName}`} />
          {networkBadge.label}
        </Badge>

        <Separator orientation="vertical" className="hidden h-6 lg:block" />

        <NotificationBell />
        <ModeToggle />
        <WalletStatus linkedAddress={linkedAddress} />
        <IdentityControls />
      </div>
    </header>
  );
}
