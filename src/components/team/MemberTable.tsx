"use client";

import { useState } from "react";
import { MoreHorizontal, Wallet, Copy, Check } from "lucide-react";
import { MemberAvatar } from "./MemberAvatar";
import { ChainRoleBadge } from "./ChainRoleBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TeamMember, ChainRoleKey, TeamOnChainRoleDef } from "@/types/team";
import { CHAIN_ROLE_BADGE_CLASS, CHAIN_ROLE_DEFS } from "@/lib/mock/team";
import { cn } from "@/lib/utils";

function activeChainKeys(m: TeamMember): ChainRoleKey[] {
  return (Object.entries(m.chainRoles) as [ChainRoleKey, boolean][])
    .filter(([, v]) => v)
    .map(([k]) => k);
}

interface MemberTableProps {
  members: TeamMember[];
  selectedId: string | null;
  onOpenMember: (member: TeamMember) => void;
  /** Issuer token roles vs QBridge platform roles — drives badge labels/styles. */
  roleDefs?: ReadonlyArray<TeamOnChainRoleDef>;
  roleBadgeClass?: Record<ChainRoleKey, string>;
}

export function MemberTable({
  members,
  selectedId,
  onOpenMember,
  roleDefs = CHAIN_ROLE_DEFS,
  roleBadgeClass = CHAIN_ROLE_BADGE_CLASS,
}: MemberTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="w-[34%] px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Member
            </th>
            <th className="w-[12%] px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </th>
            <th className="w-[13%] px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Platform
            </th>
            <th className="w-[30%] px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Chain roles
            </th>
            <th className="w-[11%] px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const chains = activeChainKeys(m);
            const isSelected = m.id === selectedId;
            return (
              <tr
                key={m.id}
                className={cn(
                  "cursor-pointer border-b border-border last:border-b-0 transition-colors",
                  isSelected ? "bg-accent/50" : "hover:bg-muted/50",
                )}
                onClick={() => onOpenMember(m)}
              >
                <td className="px-3 py-3 align-middle">
                  <div className="flex items-center gap-2.5">
                    <MemberAvatar name={m.displayName} variant={m.avatarVariant} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{m.displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                      {m.walletAddress && (
                        <MemberWalletInline address={m.walletAddress} />
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 align-middle">
                  <StatusCell status={m.status} />
                </td>
                <td className="px-3 py-3 align-middle">
                  <PlatformBadge role={m.platformRole} />
                </td>
                <td className="px-3 py-3 align-middle">
                  <ChainRolesCell
                    member={m}
                    chains={chains}
                    roleDefs={roleDefs}
                    roleBadgeClass={roleBadgeClass}
                  />
                </td>
                <td className="px-3 py-3 align-middle text-right">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label={`Open ${m.displayName}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMember(m);
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MemberWalletInline({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const short =
    address.length >= 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mt-0.5 flex min-w-0 items-center gap-0.5">
      <span className="truncate font-mono text-[11px] text-muted-foreground" title={address}>
        {short}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
        aria-label={copied ? "Copied" : "Copy wallet address"}
        onClick={(e) => void handleCopy(e)}
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

function StatusCell({ status }: { status: TeamMember["status"] }) {
  const config = {
    active: { dot: "bg-emerald-500", label: "Active" },
    invited: { dot: "bg-amber-500", label: "Invited" },
    suspended: { dot: "bg-red-500", label: "Suspended" },
  }[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", config.dot)} aria-hidden />
      {config.label}
    </span>
  );
}

function PlatformBadge({ role }: { role: TeamMember["platformRole"] }) {
  if (role === "admin") {
    return (
      <Badge className="border-transparent bg-violet-200 text-xs font-medium text-violet-950 dark:bg-violet-900/50 dark:text-violet-200">
        Admin
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs font-medium">
      Member
    </Badge>
  );
}

function ChainRolesCell({
  member,
  chains,
  roleDefs,
  roleBadgeClass,
}: {
  member: TeamMember;
  chains: ChainRoleKey[];
  roleDefs: ReadonlyArray<TeamOnChainRoleDef>;
  roleBadgeClass: Record<ChainRoleKey, string>;
}) {
  if (member.status === "invited") {
    return <span className="text-xs text-amber-700 dark:text-amber-400">Pending invite</span>;
  }
  if (!member.walletAddress) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-dashed border-border text-[10px]">
          <Wallet className="h-2.5 w-2.5 opacity-70" />
        </span>
        No wallet
      </span>
    );
  }
  if (chains.length === 0) {
    return <span className="text-xs text-muted-foreground">No roles</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {chains.map((k) => (
        <ChainRoleBadge
          key={k}
          roleKey={k}
          roleDefs={roleDefs}
          badgeClass={roleBadgeClass}
        />
      ))}
    </div>
  );
}
