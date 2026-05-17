"use client";

import { useState } from "react";
import { MoreHorizontal, Wallet, Copy, Check } from "lucide-react";
import { MemberAvatar } from "./MemberAvatar";
import { ChainRoleBadge } from "./ChainRoleBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ADMIN_TIER_KEYS,
  deriveChainTiers,
  type TeamMember,
  type ChainRoleKey,
  type ChainTier,
  type TeamOnChainRoleDef,
} from "@/types/team";
import { CHAIN_ROLE_BADGE_CLASS, CHAIN_ROLE_DEFS } from "@/lib/mock/team";
import { APP_ROLE_LABELS } from "@/lib/core/identity.types";
import { cn } from "@/lib/utils";

function activeChainKeys(m: TeamMember): ChainRoleKey[] {
  return (Object.entries(m.chainRoles) as [ChainRoleKey, boolean][])
    .filter(([, v]) => v)
    .map(([k]) => k);
}

/** Functional roles only — tier roles render as a separate badge. */
function functionalChainKeys(keys: ChainRoleKey[]): ChainRoleKey[] {
  return keys.filter((k) => k !== "SUPER_ADMIN" && !ADMIN_TIER_KEYS.has(k));
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
              Role
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
                  <PlatformBadge member={m} />
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

function PlatformBadge({ member }: { member: TeamMember }) {
  // Prefer the granular off-chain role set when present. Show the
  // primary role label (first non-baseline if available) plus a
  // "+N" overflow when the user has multiple. Fall back to the
  // legacy admin/member chip when no appRoles are set.
  const appRoles = member.appRoles ?? [];
  const isAdminLike = (r: string) => r.endsWith("_admin");
  const isBaseline = (r: string) => r === "issuer_member" || r === "ops_member";

  if (appRoles.length > 0) {
    // Pick the most informative role to show first.
    const sorted = [...appRoles].sort((a, b) => {
      if (isAdminLike(a) && !isAdminLike(b)) return -1;
      if (isAdminLike(b) && !isAdminLike(a)) return 1;
      if (isBaseline(a) && !isBaseline(b)) return 1;
      if (isBaseline(b) && !isBaseline(a)) return -1;
      return a.localeCompare(b);
    });
    const primary = sorted[0];
    const extra = sorted.length - 1;
    const isAdmin = isAdminLike(primary);
    return (
      <span className="flex flex-wrap items-center gap-1">
        <Badge
          className={cn(
            "text-xs font-medium",
            isAdmin
              ? "border-transparent bg-violet-200 text-violet-950 dark:bg-violet-900/50 dark:text-violet-200"
              : "border-transparent bg-muted text-foreground",
          )}
        >
          {APP_ROLE_LABELS[primary]}
        </Badge>
        {extra > 0 && (
          <Badge variant="secondary" className="text-[10px] font-medium">
            +{extra}
          </Badge>
        )}
      </span>
    );
  }

  if (member.platformRole === "admin") {
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
  const tiers = deriveChainTiers(member.chainRoles);
  const functional = functionalChainKeys(chains);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {tiers.map((t) => (
        <TierBadge key={t} tier={t} />
      ))}
      {functional.map((k) => (
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

/** Clerk-style coarse tier (Owner / Admin / Member) derived from chainRoles.
 *  Owner + Admin can render together — owner does NOT subsume admin in the
 *  badge column, otherwise granting role 1 to an owner is invisible. */
function TierBadge({ tier }: { tier: ChainTier }) {
  const cfg: Record<ChainTier, { label: string; cls: string }> = {
    owner: {
      label: "Owner",
      cls: "border-transparent bg-violet-300 text-violet-950 dark:bg-violet-800/60 dark:text-violet-100",
    },
    admin: {
      label: "Admin",
      cls: "border-transparent bg-violet-200 text-violet-950 dark:bg-violet-900/50 dark:text-violet-200",
    },
    member: {
      label: "Member",
      cls: "border-transparent bg-muted text-foreground",
    },
  };
  const { label, cls } = cfg[tier];
  return (
    <Badge className={cn("text-xs font-medium", cls)} title={`On-chain tier: ${label}`}>
      {label}
    </Badge>
  );
}
