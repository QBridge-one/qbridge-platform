"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { OpsSidebar } from "@/components/dashboard/ops-sidebar";
import type { AppRole } from "@/lib/core/identity.types";
import type { Address } from "@/lib/core/types";
import type { PlatformRole } from "@/types/roles";

interface OpsDashboardShellProps {
  operatorName: string;
  walletAddress?: string;
  appRoles: AppRole[] | null;
  platformRole?: PlatformRole | null;
  linkedAddress?: Address | null;
  children: React.ReactNode;
}

export function OpsDashboardShell({
  operatorName,
  walletAddress,
  appRoles,
  platformRole,
  linkedAddress = null,
  children,
}: OpsDashboardShellProps) {
  return (
    <DashboardShell
      renderSidebar={({ mobile, onNavigate }) => (
        <OpsSidebar
          operatorName={operatorName}
          walletAddress={walletAddress}
          appRoles={appRoles}
          platformRole={platformRole}
          mobile={mobile}
          onNavigate={onNavigate}
        />
      )}
      header={
        <DashboardHeader
          searchPlaceholder="Search issuers, flags, activity…"
          networkBadge={{
            label: "Ops · Sepolia",
            dotClassName: "bg-amber-500",
          }}
          linkedAddress={linkedAddress}
        />
      }
    >
      {children}
    </DashboardShell>
  );
}
