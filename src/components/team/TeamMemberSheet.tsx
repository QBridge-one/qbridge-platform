"use client";

import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { CheckCircle2, ExternalLink, Loader2, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { MemberAvatar } from "./MemberAvatar";
import { CHAIN_ROLE_BADGE_CLASS, CHAIN_ROLE_DEFS } from "@/lib/mock/team";
import type { TeamMember, ChainRoleKey, TeamOnChainRoleDef } from "@/types/team";
import type { Address, Hex } from "@/lib/core/types";
import { APP_ROLES, APP_ROLE_LABELS, type AppRole } from "@/lib/core/identity.types";
import {
  useGrantRole as useTokenGrantRole,
  useRevokeRole as useTokenRevokeRole,
} from "@/lib/generated/token-access-manager";
import {
  useGrantRole as usePlatformGrantRole,
  useRevokeRole as usePlatformRevokeRole,
} from "@/lib/generated/platform-access-manager";
import { usePlatformAMAddress, useTokenAMAddress } from "@/lib/hooks/useContracts";
import { useChainId, useSwitchChain } from "wagmi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/** Deployment chain the wallet must be on. Mirrors src/config/web3auth.ts. */
const EXPECTED_CHAIN_ID =
  process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK === "mainnet" ? 1 : 11155111;

function explorerAddressUrl(chainId: number, address: string): string | null {
  if (chainId === 11155111) return `https://sepolia.etherscan.io/address/${address}`;
  if (chainId === 1) return `https://etherscan.io/address/${address}`;
  if (chainId === 137) return `https://polygonscan.com/address/${address}`;
  return null;
}

function explorerTxUrl(chainId: number, hash: string): string | null {
  if (chainId === 11155111) return `https://sepolia.etherscan.io/tx/${hash}`;
  if (chainId === 1) return `https://etherscan.io/tx/${hash}`;
  if (chainId === 137) return `https://polygonscan.com/tx/${hash}`;
  return null;
}

function notifyRoleTxSuccess(chainId: number, hash: Hex, roleLabel: string) {
  const url = explorerTxUrl(chainId, hash);
  toast.success(`${roleLabel}: updated on-chain`, {
    description: "Transaction confirmed in a block.",
    action: url
      ? {
          label: "View transaction",
          onClick: () => window.open(url, "_blank", "noopener,noreferrer"),
        }
      : undefined,
    duration: 12000,
  });
}

function isSameAddress(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

interface TeamMemberSheetProps {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectedAddress: Address | null;
  chainId: number;
  onUpdateMember: (id: string, patch: Partial<TeamMember>) => void;
  onChainRoleChange: (memberId: string, roleKey: ChainRoleKey, checked: boolean) => void;
  onRemoveMember: (id: string) => Promise<void>;
  /** Persist a new app-role set for this member. Returns when persisted. */
  onAppRolesChange?: (memberId: string, appRoles: AppRole[]) => Promise<void>;
  /** Token = issuer TokenAccessManager; platform = QBridge PlatformAccessManager (ops). */
  accessManager?: "token" | "platform";
  roleDefs?: ReadonlyArray<TeamOnChainRoleDef>;
  roleBadgeClass?: Record<ChainRoleKey, string>;
}

export function TeamMemberSheet({
  member,
  open,
  onOpenChange,
  connectedAddress,
  chainId,
  onUpdateMember,
  onChainRoleChange,
  onRemoveMember,
  onAppRolesChange,
  accessManager = "token",
  roleDefs = CHAIN_ROLE_DEFS,
  roleBadgeClass = CHAIN_ROLE_BADGE_CLASS,
}: TeamMemberSheetProps) {
  const [removing, setRemoving] = useState(false);

  if (!member) return null;

  const isSelf = isSameAddress(member.walletAddress ?? undefined, connectedAddress ?? undefined);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemoveMember(member.id);
      onOpenChange(false);
    } finally {
      setRemoving(false);
    }
  };

  const displayName =
    member.displayName.includes("@") && member.status === "invited"
      ? member.email
      : member.displayName;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 overflow-hidden p-0">
        <SheetTitle className="sr-only">
          {displayName} — team member
        </SheetTitle>

        <div className="flex items-start gap-3 border-b border-border p-4">
          <MemberAvatar name={member.displayName} variant={member.avatarVariant} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">{member.email}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onOpenChange(false)}
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="profile" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="h-auto w-full justify-start rounded-none border-b border-border bg-transparent p-0 px-4">
            <TabsTrigger
              value="profile"
              className="rounded-none border-b-2 border-transparent px-0 py-3 text-sm data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="permissions"
              className="ml-6 rounded-none border-b-2 border-transparent px-0 py-3 text-sm data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Permissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-0 flex-1 overflow-y-auto p-4 focus-visible:outline-none">
            <section className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account</p>
              <InfoRow label="Name" value={member.displayName.includes("@") ? "—" : member.displayName} />
              <InfoRow label="Email" value={member.email} />
              <InfoRow
                label="Platform role"
                value={member.platformRole === "admin" ? "Admin" : "Member"}
              />
              <InfoRow
                label="Member since"
                value={format(new Date(member.joinedAt), "MMM d, yyyy")}
              />
              <InfoRow
                label="Last active"
                value={
                  member.lastActiveAt
                    ? formatDistanceToNow(new Date(member.lastActiveAt), { addSuffix: true })
                    : "—"
                }
              />
            </section>

            <section className="mt-6 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Wallet</p>
              {member.walletAddress ? (
                <WalletBlock address={member.walletAddress} chainId={chainId} />
              ) : (
                <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-4 text-center text-sm text-muted-foreground">
                  No wallet connected yet
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent
            value="permissions"
            className="mt-0 flex-1 overflow-y-auto p-4 focus-visible:outline-none"
          >
            {member.status === "invited" && (
              <Alert className="mb-4 border-amber-500/40 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                <AlertDescription className="text-sm">
                  This member hasn&apos;t accepted their invite yet. Chain roles will be available once they
                  join and connect a wallet.
                </AlertDescription>
              </Alert>
            )}

            <AppRolesSection
              member={member}
              accessManager={accessManager}
              isSelf={isSelf}
              onAppRolesChange={onAppRolesChange}
              onLocalUpdate={(roles) => onUpdateMember(member.id, { appRoles: roles })}
            />

            <section className="mt-6 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Platform access
              </p>
              <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
                <span className="text-sm font-medium">Admin</span>
                <Switch
                  checked={member.platformRole === "admin"}
                  disabled={isSelf}
                  onCheckedChange={(checked) =>
                    onUpdateMember(member.id, { platformRole: checked ? "admin" : "member" })
                  }
                  aria-label="Platform admin"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Coarse Clerk role (admin / member). Auto-derived from the
                workspace roles above — granular roles are the source of truth.
              </p>
            </section>

            <section className="mt-6 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {accessManager === "platform" ? "Platform on-chain roles" : "On-chain roles"}
              </p>
              {member.status !== "invited" && !member.walletAddress && (
                <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-4 text-center text-sm text-muted-foreground">
                  No wallet connected — chain roles unavailable.
                </div>
              )}
              {member.status !== "invited" &&
                member.walletAddress &&
                roleDefs.map((def) =>
                  accessManager === "platform" ? (
                    <PlatformChainRoleToggleRow
                      key={def.key}
                      member={member}
                      def={def}
                      chainId={chainId}
                      hasRole={Boolean(member.chainRoles[def.key])}
                      isSelf={isSelf}
                      roleBadgeClass={roleBadgeClass}
                      onConfirmed={(roleKey, checked) => onChainRoleChange(member.id, roleKey, checked)}
                    />
                  ) : (
                    <TokenChainRoleToggleRow
                      key={def.key}
                      member={member}
                      def={def}
                      chainId={chainId}
                      hasRole={Boolean(member.chainRoles[def.key])}
                      isSelf={isSelf}
                      roleBadgeClass={roleBadgeClass}
                      onConfirmed={(roleKey, checked) => onChainRoleChange(member.id, roleKey, checked)}
                    />
                  ),
                )}
            </section>

            {!isSelf && (
              <section className="mt-8 border-t border-border pt-6">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-destructive">
                  Danger zone
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={removing}
                  onClick={() => void handleRemove()}
                >
                  {removing ? "Removing…" : "Remove from team"}
                </Button>
              </section>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border py-1.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[55%] truncate text-right text-xs font-medium">{value}</span>
    </div>
  );
}

/** Compact "wrong network" hint with a one-click switch. Used in chain-role toggle rows. */
function WrongNetworkHint({ expectedChainId }: { expectedChainId: number }) {
  const { switchChain, isPending } = useSwitchChain();
  const name = expectedChainId === 1 ? "Ethereum" : expectedChainId === 137 ? "Polygon" : "Sepolia";
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-amber-400/40 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
      <span>Wrong network — chain roles live on {name}.</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-6 px-2 text-[11px]"
        disabled={isPending}
        onClick={() => switchChain({ chainId: expectedChainId })}
      >
        {isPending ? "Switching…" : `Switch to ${name}`}
      </Button>
    </div>
  );
}

/** Inline status while a role grant/revoke runs and after `TransactionService` confirms the tx. */
function ChainRoleTxStatus({
  loading,
  txHash,
  chainId,
  onDismiss,
}: {
  loading: boolean;
  txHash: Hex | null;
  chainId: number;
  onDismiss: () => void;
}) {
  if (txHash) {
    const url = explorerTxUrl(chainId, txHash);
    return (
      <div className="mt-2 flex flex-col gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/30">
        <div className="flex items-start gap-2">
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Confirmed on-chain</p>
            <p className="text-xs text-emerald-700/90 dark:text-emerald-300/90">
              The role change was included in a block. You can verify the transaction below.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-6">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-mono text-xs text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-300"
            >
              {txHash.slice(0, 18)}…{txHash.slice(-10)} ↗
            </a>
          ) : (
            <span className="break-all font-mono text-xs text-emerald-800 dark:text-emerald-200">{txHash}</span>
          )}
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div
        className="mt-2 flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3 py-2"
        role="status"
        aria-live="polite"
      >
        <Loader2
          className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-muted-foreground"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground">On-chain update in progress</p>
          <p className="text-xs text-muted-foreground">
            We are preparing the transaction and then your wallet will ask you to sign. This updates Access
            Manager roles on-chain (gas may apply).
          </p>
        </div>
      </div>
    );
  }
  return null;
}

function WalletBlock({ address, chainId }: { address: Address; chainId: number }) {
  const [copied, setCopied] = useState(false);
  const url = explorerAddressUrl(chainId, address);

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-md bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground">Connected wallet</p>
      <p className="mt-1 break-all font-mono text-xs text-foreground">{address}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" className="h-8 text-xs" onClick={() => void copy()}>
          {copied ? "Copied" : "Copy"}
        </Button>
        {url && (
          <Button type="button" variant="secondary" size="sm" className="h-8 text-xs" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1 h-3 w-3" />
              Etherscan
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

function TokenChainRoleToggleRow({
  member,
  def,
  chainId,
  hasRole,
  isSelf,
  roleBadgeClass,
  onConfirmed,
}: {
  member: TeamMember;
  def: TeamOnChainRoleDef;
  chainId: number;
  hasRole: boolean;
  isSelf: boolean;
  roleBadgeClass: Record<ChainRoleKey, string>;
  onConfirmed: (roleKey: ChainRoleKey, checked: boolean) => void;
}) {
  const { grantRole, isLoading: granting, error: grantErr, reset: resetGrant } = useTokenGrantRole();
  const { revokeRole, isLoading: revoking, error: revokeErr, reset: resetRevoke } = useTokenRevokeRole();
  const tokenAddress = useTokenAMAddress();
  const walletChainId = useChainId();
  const wrongChain = walletChainId !== EXPECTED_CHAIN_ID;
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmedTxHash, setConfirmedTxHash] = useState<Hex | null>(null);
  const loading = granting || revoking;
  const wallet = member.walletAddress;
  const disabled =
    !wallet || !tokenAddress || wrongChain || loading || (isSelf && def.key === "ADMIN");

  const handleToggle = async (checked: boolean) => {
    if (!wallet || !tokenAddress || wrongChain) return;
    setLocalError(null);
    setConfirmedTxHash(null);
    resetGrant();
    resetRevoke();
    try {
      let hashReturned: Hex | null = null;
      if (checked) {
        const h = await grantRole({
          roleId: def.roleId,
          account: wallet,
          executionDelay: 0,
        });
        hashReturned = h ? (h as Hex) : null;
      } else {
        const h = await revokeRole({
          roleId: def.roleId,
          account: wallet,
        });
        hashReturned = h ? (h as Hex) : null;
      }
      onConfirmed(def.key, checked);
      if (hashReturned) {
        setConfirmedTxHash(hashReturned);
        notifyRoleTxSuccess(chainId, hashReturned, def.label);
      }
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Transaction failed");
    }
  };

  const errMsg = localError ?? grantErr?.message ?? revokeErr?.message;

  return (
    <div className="space-y-1 border-b border-border py-2 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("text-xs", roleBadgeClass[def.key])}>
              {def.label}
            </Badge>
            {hasRole && member.joinedAt && (
              <span className="text-xs text-muted-foreground">
                since {format(new Date(member.joinedAt), "MMM d, yyyy")}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{def.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />}
          <Switch
            checked={hasRole}
            disabled={disabled}
            onCheckedChange={(c) => void handleToggle(c)}
            aria-label={`Toggle ${def.label}`}
          />
        </div>
      </div>
      {errMsg && <p className="text-xs text-destructive">{errMsg}</p>}
      {wrongChain && <WrongNetworkHint expectedChainId={EXPECTED_CHAIN_ID} />}
      <ChainRoleTxStatus
        loading={loading}
        txHash={confirmedTxHash}
        chainId={chainId}
        onDismiss={() => setConfirmedTxHash(null)}
      />
    </div>
  );
}

// ─── App-roles (off-chain RBAC) section ─────────────────────────────
// Lets a workspace/ops admin grant or revoke granular off-chain roles
// for a member. This is a vendor-agnostic call (PATCH the membership);
// it does NOT touch the chain. The chain-roles section below is what
// updates the AccessManager contract.

const ISSUER_ROLE_OPTIONS = APP_ROLES.filter((r) => r.startsWith("issuer_"));
const OPS_ROLE_OPTIONS = APP_ROLES.filter((r) => r.startsWith("ops_"));

const APP_ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  issuer_admin: "Full workspace control — manage team, settings, all assets and offerings.",
  issuer_compliance: "Approve investors / offerings, freeze accounts, run KYC reviews and reports.",
  issuer_dealer: "Onboard prospective investors. Read cap table, no compliance authority.",
  issuer_operations: "Day-to-day ops — propose distributions, manage offerings lifecycle.",
  issuer_property_manager: "Edit asset / property data. Read cap table, no investor actions.",
  issuer_auditor: "Read-only — cap table, reports, audit exports.",
  issuer_member: "Baseline workspace member — read-only dashboard access.",
  ops_admin: "Full ops control — team, settings, contracts, all platform actions.",
  ops_compliance: "Platform compliance — approve issuers, freeze investors, audit exports.",
  ops_onboarding: "Issuer onboarding / KYB review. No global enforcement.",
  ops_support: "Read-only support — view investor / issuer data, no mutations.",
  ops_engineer: "Platform engineering — feature flags, contract deploys, audit exports.",
  ops_member: "Baseline ops member — read-only dashboard access.",
};

function AppRolesSection({
  member,
  accessManager,
  isSelf,
  onAppRolesChange,
  onLocalUpdate,
}: {
  member: TeamMember;
  accessManager: "token" | "platform";
  isSelf: boolean;
  onAppRolesChange?: (memberId: string, appRoles: AppRole[]) => Promise<void>;
  onLocalUpdate: (roles: AppRole[]) => void;
}) {
  const planeOptions = accessManager === "platform" ? OPS_ROLE_OPTIONS : ISSUER_ROLE_OPTIONS;
  const baseline: AppRole = accessManager === "platform" ? "ops_member" : "issuer_member";
  const adminRole: AppRole = accessManager === "platform" ? "ops_admin" : "issuer_admin";

  const current = useMemo<AppRole[]>(
    () => (member.appRoles && member.appRoles.length > 0 ? member.appRoles : [baseline]),
    [member.appRoles, baseline],
  );

  const [pending, setPending] = useState<AppRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readOnly = !onAppRolesChange;

  const persist = async (next: AppRole[]) => {
    setError(null);
    if (!onAppRolesChange) {
      onLocalUpdate(next);
      return;
    }
    try {
      await onAppRolesChange(member.id, next);
      onLocalUpdate(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update roles");
    }
  };

  const handleToggle = async (role: AppRole, checked: boolean) => {
    setPending(role);
    try {
      const set = new Set(current);
      if (checked) set.add(role);
      else set.delete(role);
      // Always keep the baseline so a member never ends up role-less.
      set.add(baseline);
      // Stable order: baseline first, admin second, then alphabetical.
      const next = [...set].sort((a, b) => {
        if (a === baseline) return -1;
        if (b === baseline) return 1;
        if (a === adminRole) return -1;
        if (b === adminRole) return 1;
        return a.localeCompare(b);
      });
      await persist(next);
    } finally {
      setPending(null);
    }
  };

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {accessManager === "platform" ? "Ops access" : "Workspace access"}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {current.length} role{current.length === 1 ? "" : "s"}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Off-chain dashboard permissions. These don&apos;t grant on-chain
        authority — that&apos;s what the chain-roles list below is for.
      </p>
      {error && (
        <Alert variant="destructive" className="my-2">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
      <div className="rounded-md border border-border bg-card">
        {planeOptions.map((role) => {
          const checked = current.includes(role);
          const isBaseline = role === baseline;
          const isAdmin = role === adminRole;
          // Disable: read-only, baseline (always on), self trying to drop their own admin,
          // or while another toggle on this row is in flight.
          const disabled =
            readOnly ||
            isBaseline ||
            (isSelf && isAdmin && checked) ||
            pending === role;
          return (
            <div
              key={role}
              className="flex items-start justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{APP_ROLE_LABELS[role]}</span>
                  {isBaseline && (
                    <Badge variant="secondary" className="text-[10px]">
                      Baseline
                    </Badge>
                  )}
                  {isAdmin && (
                    <Badge className="border-transparent bg-violet-200 text-[10px] text-violet-950 dark:bg-violet-900/50 dark:text-violet-200">
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {APP_ROLE_DESCRIPTIONS[role]}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {pending === role && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden />
                )}
                <Switch
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(c) => void handleToggle(role, c)}
                  aria-label={`Toggle ${APP_ROLE_LABELS[role]}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PlatformChainRoleToggleRow({
  member,
  def,
  chainId,
  hasRole,
  isSelf,
  roleBadgeClass,
  onConfirmed,
}: {
  member: TeamMember;
  def: TeamOnChainRoleDef;
  chainId: number;
  hasRole: boolean;
  isSelf: boolean;
  roleBadgeClass: Record<ChainRoleKey, string>;
  onConfirmed: (roleKey: ChainRoleKey, checked: boolean) => void;
}) {
  const { grantRole, isLoading: granting, error: grantErr, reset: resetGrant } = usePlatformGrantRole();
  const { revokeRole, isLoading: revoking, error: revokeErr, reset: resetRevoke } = usePlatformRevokeRole();
  const platformAddress = usePlatformAMAddress();
  const walletChainId = useChainId();
  const wrongChain = walletChainId !== EXPECTED_CHAIN_ID;
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmedTxHash, setConfirmedTxHash] = useState<Hex | null>(null);
  const loading = granting || revoking;
  const wallet = member.walletAddress;
  const disabled =
    !wallet || !platformAddress || wrongChain || loading || (isSelf && def.key === "ADMIN");

  const handleToggle = async (checked: boolean) => {
    if (!wallet || !platformAddress || wrongChain) return;
    setLocalError(null);
    setConfirmedTxHash(null);
    resetGrant();
    resetRevoke();
    try {
      let hashReturned: Hex | null = null;
      if (checked) {
        const h = await grantRole({
          roleId: def.roleId,
          account: wallet,
          executionDelay: 0,
        });
        hashReturned = h ? (h as Hex) : null;
      } else {
        const h = await revokeRole({
          roleId: def.roleId,
          account: wallet,
        });
        hashReturned = h ? (h as Hex) : null;
      }
      onConfirmed(def.key, checked);
      if (hashReturned) {
        setConfirmedTxHash(hashReturned);
        notifyRoleTxSuccess(chainId, hashReturned, def.label);
      }
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Transaction failed");
    }
  };

  const errMsg = localError ?? grantErr?.message ?? revokeErr?.message;

  return (
    <div className="space-y-1 border-b border-border py-2 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("text-xs", roleBadgeClass[def.key])}>
              {def.label}
            </Badge>
            {hasRole && member.joinedAt && (
              <span className="text-xs text-muted-foreground">
                since {format(new Date(member.joinedAt), "MMM d, yyyy")}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{def.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />}
          <Switch
            checked={hasRole}
            disabled={disabled}
            onCheckedChange={(c) => void handleToggle(c)}
            aria-label={`Toggle ${def.label}`}
          />
        </div>
      </div>
      {errMsg && <p className="text-xs text-destructive">{errMsg}</p>}
      {wrongChain && <WrongNetworkHint expectedChainId={EXPECTED_CHAIN_ID} />}
      <ChainRoleTxStatus
        loading={loading}
        txHash={confirmedTxHash}
        chainId={chainId}
        onDismiss={() => setConfirmedTxHash(null)}
      />
    </div>
  );
}
