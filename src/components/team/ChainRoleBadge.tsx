"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChainRoleKey, TeamOnChainRoleDef } from "@/types/team";
import { CHAIN_ROLE_BADGE_CLASS, CHAIN_ROLE_DEFS } from "@/lib/mock/team";

interface ChainRoleBadgeProps {
  roleKey: ChainRoleKey;
  /** When set (e.g. ops platform roles), labels resolve from this list. */
  roleDefs?: ReadonlyArray<TeamOnChainRoleDef>;
  badgeClass?: Record<ChainRoleKey, string>;
  className?: string;
}

export function ChainRoleBadge({
  roleKey,
  roleDefs = CHAIN_ROLE_DEFS,
  badgeClass = CHAIN_ROLE_BADGE_CLASS,
  className,
}: ChainRoleBadgeProps) {
  const def = roleDefs.find((d) => d.key === roleKey);
  const label = def?.label ?? roleKey;
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", badgeClass[roleKey], className)}
    >
      {label}
    </Badge>
  );
}
