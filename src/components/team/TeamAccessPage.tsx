"use client";

import { useCallback, useMemo, useState } from "react";
import { InviteBar } from "@/components/team/InviteBar";
import { MemberTable } from "@/components/team/MemberTable";
import { RoleReference } from "@/components/team/RoleReference";
import { TeamMemberSheet } from "@/components/team/TeamMemberSheet";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWallet } from "@/lib/hooks/useWallet";
import { useContracts } from "@/lib/hooks/useContracts";
import type { TeamMember, ChainRoleKey, TeamInvitePayload, AvatarVariant, TeamOnChainRoleDef } from "@/types/team";
import type { AppRole } from "@/lib/core/identity.types";
import { cn } from "@/lib/utils";

const AVATAR_ROTATION: AvatarVariant[] = ["blue", "purple", "teal", "amber", "gray"];

type FilterKey = "all" | "active" | "pending";

export interface TeamAccessPageProps {
  title: string;
  description: string;
  initialMembers: TeamMember[];
  accessManager: "token" | "platform";
  roleDefs: ReadonlyArray<TeamOnChainRoleDef>;
  roleBadgeClass: Record<ChainRoleKey, string>;
  /** Off-chain RBAC gates resolved server-side. */
  canInvite?: boolean;
  canManage?: boolean;
}

export function TeamAccessPage({
  title,
  description,
  initialMembers,
  accessManager,
  roleDefs,
  roleBadgeClass,
  canInvite = true,
  canManage = true,
}: TeamAccessPageProps) {
  const { address: connectedAddress } = useWallet();
  const { chainId } = useContracts();

  const [members, setMembers] = useState<TeamMember[]>(() => [...initialMembers]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (filter === "all") return true;
      if (filter === "active") return m.status === "active";
      return m.status === "invited";
    });
  }, [members, filter]);

  const openMember = useCallback((m: TeamMember) => {
    setSelectedMember(m);
    setSheetOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedMember(null);
  }, []);

  const handleInvite = useCallback(
    async (payload: TeamInvitePayload) => {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: payload.email, platformRole: payload.platformRole }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Invite failed");
      }
      const data = (await res.json()) as {
        id?: string;
        appRole?: AppRole;
        appRoles?: AppRole[];
        platformRole?: "admin" | "member";
      };
      const id = data.id ?? `tm-${crypto.randomUUID()}`;
      const variant = AVATAR_ROTATION[members.length % AVATAR_ROTATION.length];
      const appRoles =
        data.appRoles && data.appRoles.length > 0
          ? data.appRoles
          : data.appRole
            ? [data.appRole]
            : undefined;
      const newMember: TeamMember = {
        id,
        email: payload.email,
        displayName: payload.email,
        status: "invited",
        platformRole: data.platformRole ?? payload.platformRole,
        appRoles,
        walletAddress: null,
        joinedAt: new Date().toISOString(),
        lastActiveAt: null,
        chainRoles: {},
        avatarVariant: variant,
      };
      setMembers((prev) => [...prev, newMember]);
    },
    [members.length],
  );

  const handleRemove = useCallback(
    async (memberId: string) => {
      setListError(null);
      // Branch: invited rows carry an invite id (not a user id), so
      // they must revoke through the invite endpoint. Active members
      // route to the legacy /api/team/[id] remove endpoint.
      const target = members.find((m) => m.id === memberId);
      const path =
        target?.status === "invited"
          ? `/api/team/invite/${encodeURIComponent(memberId)}`
          : `/api/team/${encodeURIComponent(memberId)}`;
      try {
        const res = await fetch(path, { method: "DELETE" });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(
            data.error ?? (target?.status === "invited" ? "Revoke failed" : "Remove failed"),
          );
        }
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } catch (e) {
        setListError(
          e instanceof Error
            ? e.message
            : target?.status === "invited"
              ? "Revoke failed"
              : "Remove failed",
        );
        throw e;
      }
    },
    [members],
  );

  const handleUpdateMember = useCallback((id: string, patch: Partial<TeamMember>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    setSelectedMember((cur) => (cur && cur.id === id ? { ...cur, ...patch } : cur));
  }, []);

  const handleChainRoleChange = useCallback(
    (memberId: string, roleKey: ChainRoleKey, checked: boolean) => {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, chainRoles: { ...m.chainRoles, [roleKey]: checked } } : m,
        ),
      );
      setSelectedMember((cur) =>
        cur && cur.id === memberId
          ? { ...cur, chainRoles: { ...cur.chainRoles, [roleKey]: checked } }
          : cur,
      );
    },
    [],
  );

  // Persist the granular off-chain role set for a member. Calls the
  // PATCH endpoint with `appRoles[]`; on success the local state is
  // updated by `handleUpdateMember` (called from inside the sheet).
  // Throws on error so the sheet's <AppRolesSection> can surface it.
  const handleAppRolesChange = useCallback(
    async (memberId: string, appRoles: AppRole[]) => {
      const res = await fetch(`/api/team/members/${encodeURIComponent(memberId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appRoles }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to update roles");
      }
    },
    [],
  );

  const filterBtn = (key: FilterKey, label: string) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 text-xs",
        filter === key ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
      )}
      onClick={() => setFilter(key)}
    >
      {label}
    </Button>
  );

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-lg font-medium tracking-tight">{title}</h1>
        <p className="max-w-lg text-sm text-muted-foreground">{description}</p>
      </header>

      {canInvite ? (
        <InviteBar onInvite={handleInvite} />
      ) : (
        <Alert>
          <AlertDescription>
            You have view-only access to this team. Workspace admins can invite or remove members.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Members <span className="text-muted-foreground/70">&nbsp;·&nbsp;</span>{" "}
          <span className="tabular-nums text-foreground">{filtered.length}</span>
        </p>
        <div className="flex flex-wrap gap-1">
          {filterBtn("all", "All")}
          {filterBtn("active", "Active")}
          {filterBtn("pending", "Pending")}
        </div>
      </div>

      {listError && (
        <Alert variant="destructive">
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      )}

      <MemberTable
        members={filtered}
        selectedId={selectedMember?.id ?? null}
        onOpenMember={openMember}
        roleDefs={roleDefs}
        roleBadgeClass={roleBadgeClass}
      />

      <RoleReference defs={roleDefs} badgeClass={roleBadgeClass} />

      <TeamMemberSheet
        member={selectedMember}
        open={sheetOpen && selectedMember !== null}
        onOpenChange={handleSheetOpenChange}
        connectedAddress={connectedAddress}
        chainId={chainId}
        onUpdateMember={canManage ? handleUpdateMember : () => {}}
        onChainRoleChange={canManage ? handleChainRoleChange : () => {}}
        onAppRolesChange={canManage ? handleAppRolesChange : undefined}
        onRemoveMember={
          canManage
            ? handleRemove
            : async () => {
                throw new Error("View-only: workspace admin required to remove a member.");
              }
        }
        accessManager={accessManager}
        roleDefs={roleDefs}
        roleBadgeClass={roleBadgeClass}
      />
    </div>
  );
}
