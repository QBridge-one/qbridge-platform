"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PortalSidebar } from "@/components/dashboard/portal-sidebar";
import type { Address } from "@/lib/core/types";

interface PortalDashboardShellProps {
  clientName: string;
  linkedAddress?: Address | null;
  children: React.ReactNode;
}

export function PortalDashboardShell({
  clientName,
  linkedAddress = null,
  children,
}: PortalDashboardShellProps) {
  return (
    <DashboardShell
      renderSidebar={({ mobile, onNavigate }) => (
        <PortalSidebar clientName={clientName} mobile={mobile} onNavigate={onNavigate} />
      )}
      header={
        <DashboardHeader
          searchPlaceholder="Search payments, payees…"
          networkBadge={{
            label: "Ethereum Sepolia",
            dotClassName: "bg-emerald-500",
          }}
          linkedAddress={linkedAddress}
        />
      }
    >
      {children}
    </DashboardShell>
  );
}
