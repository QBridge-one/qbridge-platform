"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { WorkspaceSidebar } from "@/components/dashboard/workspace-sidebar";
import type { AppRole } from "@/lib/core/identity.types";
import type { Address } from "@/lib/core/types";

interface WorkspaceDashboardShellProps {
  issuerName: string;
  walletAddress?: string;
  appRoles: AppRole[] | null;
  linkedAddress?: Address | null;
  children: React.ReactNode;
}

export function WorkspaceDashboardShell({
  issuerName,
  walletAddress,
  appRoles,
  linkedAddress = null,
  children,
}: WorkspaceDashboardShellProps) {
  return (
    <DashboardShell
      renderSidebar={({ mobile, onNavigate }) => (
        <WorkspaceSidebar
          issuerName={issuerName}
          walletAddress={walletAddress}
          appRoles={appRoles}
          mobile={mobile}
          onNavigate={onNavigate}
        />
      )}
      header={
        <DashboardHeader
          searchPlaceholder="Search assets, investors…"
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
