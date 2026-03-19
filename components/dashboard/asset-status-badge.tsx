"use client";

// ============================================================
// components/dashboard/asset-status-badge.tsx
// Shared status badge used in asset list + detail pages
// ============================================================

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AssetStatus } from "@/types/assets";

const STATUS_CONFIG: Record<
  AssetStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; dot?: string }
> = {
  DRAFT:          { label: "Draft",           variant: "outline" },
  PENDING_REVIEW: { label: "Pending Review",  variant: "secondary", dot: "bg-amber-500" },
  APPROVED:       { label: "Approved",        variant: "secondary", dot: "bg-emerald-500" },
  REJECTED:       { label: "Rejected",        variant: "destructive" },
  DEPLOYING:      { label: "Deploying",       variant: "secondary", dot: "bg-blue-500 animate-pulse" },
  LIVE:           { label: "Live",            variant: "default",   dot: "bg-emerald-400" },
  PAUSED:         { label: "Paused",          variant: "secondary", dot: "bg-amber-400" },
  CLOSED:         { label: "Closed",          variant: "outline" },
};

export function AssetStatusBadge({
  status,
  className,
}: {
  status: AssetStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant={config.variant}
      className={cn("gap-1.5 text-[11px] font-medium", className)}
    >
      {config.dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
      )}
      {config.label}
    </Badge>
  );
}
