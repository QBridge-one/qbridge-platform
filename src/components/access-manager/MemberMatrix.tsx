"use client";

import type { AccessManagerConfig, AMMember } from "@/types/access-manager";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useHasRole as usePlatformHasRole } from "@/lib/generated/platform-access-manager";
import { useHasRole as useTokenHasRole } from "@/lib/generated/token-access-manager";
import { PLATFORM_ROLES, TOKEN_ROLES } from "@/lib/contracts/roles";
import type { Address } from "@/lib/core/types";

function shortAddr(a: string) {
  if (a.startsWith("0x") && a.length >= 10) {
    return `${a.slice(0, 6)}…${a.slice(-4)}`;
  }
  return a;
}

function RoleCellPlatform({
  contractAddress,
  roleId,
  account,
  chainId,
}: {
  contractAddress: Address;
  roleId: bigint;
  account: Address;
  chainId: number;
}) {
  const result = usePlatformHasRole(contractAddress, roleId, account, chainId);
  const has = result.data?.[0] ?? false;

  if (result.isLoading) {
    return (
      <div
        className={cn(
          "min-w-[72px] flex-1 flex items-center justify-center border-l border-border/60"
        )}
      >
        <span className="text-xs text-muted-foreground/50 animate-pulse">…</span>
      </div>
    );
  }

  if (result.isError) {
    return (
      <div
        className={cn(
          "min-w-[72px] flex-1 flex items-center justify-center border-l border-border/60"
        )}
      >
        <span className="text-xs text-destructive/70" title={result.error?.message}>
          ?
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-w-[72px] flex-1 flex items-center justify-center border-l border-border/60",
        has && "bg-primary/5"
      )}
    >
      <span
        className={cn(
          "text-xs font-semibold",
          has ? "text-primary" : "text-muted-foreground/35"
        )}
      >
        {has ? "●" : "—"}
      </span>
    </div>
  );
}

function RoleCellToken({
  contractAddress,
  roleId,
  account,
  chainId,
}: {
  contractAddress: Address;
  roleId: bigint;
  account: Address;
  chainId: number;
}) {
  const result = useTokenHasRole(contractAddress, roleId, account, chainId);
  const has = result.data?.[0] ?? false;

  if (result.isLoading) {
    return (
      <div
        className={cn(
          "min-w-[72px] flex-1 flex items-center justify-center border-l border-border/60"
        )}
      >
        <span className="text-xs text-muted-foreground/50 animate-pulse">…</span>
      </div>
    );
  }

  if (result.isError) {
    return (
      <div
        className={cn(
          "min-w-[72px] flex-1 flex items-center justify-center border-l border-border/60"
        )}
      >
        <span className="text-xs text-destructive/70" title={result.error?.message}>
          ?
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-w-[72px] flex-1 flex items-center justify-center border-l border-border/60",
        has && "bg-primary/5"
      )}
    >
      <span
        className={cn(
          "text-xs font-semibold",
          has ? "text-primary" : "text-muted-foreground/35"
        )}
      >
        {has ? "●" : "—"}
      </span>
    </div>
  );
}

function RoleCell({
  contractAddress,
  roleKey,
  account,
  scope,
  chainId,
}: {
  contractAddress: Address;
  roleKey: string;
  account: Address;
  scope: AccessManagerConfig["scope"];
  chainId: number;
}) {
  const roleId =
    scope === "platform"
      ? (PLATFORM_ROLES as Record<string, bigint>)[roleKey]
      : (TOKEN_ROLES as Record<string, bigint>)[roleKey];

  const roleIdBigInt = roleId ?? BigInt(0);

  if (scope === "platform") {
    return (
      <RoleCellPlatform
        contractAddress={contractAddress}
        roleId={roleIdBigInt}
        account={account}
        chainId={chainId}
      />
    );
  }

  return (
    <RoleCellToken
      contractAddress={contractAddress}
      roleId={roleIdBigInt}
      account={account}
      chainId={chainId}
    />
  );
}

function MemberRow({
  member,
  roleKeys,
  config,
}: {
  member: AMMember;
  roleKeys: string[];
  config: AccessManagerConfig;
}) {
  const contractAddress = config.contractAddress as Address | null;
  const chainId = config.chainId;

  if (!contractAddress) {
    return (
      <div className="flex border-b last:border-0 bg-card">
        <div className="w-48 shrink-0 px-3 py-2.5 border-r border-border/60">
          <p className="font-medium text-sm truncate">
            {member.displayName ?? shortAddr(member.walletAddress)}
          </p>
          <p className="text-[11px] font-mono text-muted-foreground truncate">
            {shortAddr(member.walletAddress)}
          </p>
          {!member.isActive && (
            <Badge variant="secondary" className="mt-1 text-[10px] h-5">
              Inactive
            </Badge>
          )}
        </div>
        <div className="flex flex-1 px-3 py-2.5 text-xs text-muted-foreground">
          No contract address
        </div>
      </div>
    );
  }

  return (
    <div className="flex border-b last:border-0 bg-card">
      <div className="w-48 shrink-0 px-3 py-2.5 border-r border-border/60">
        <p className="font-medium text-sm truncate">
          {member.displayName ?? shortAddr(member.walletAddress)}
        </p>
        <p className="text-[11px] font-mono text-muted-foreground truncate">
          {shortAddr(member.walletAddress)}
        </p>
        {!member.isActive && (
          <Badge variant="secondary" className="mt-1 text-[10px] h-5">
            Inactive
          </Badge>
        )}
      </div>
      <div className="flex flex-1">
        {roleKeys.map((rk) => (
          <RoleCell
            key={rk}
            contractAddress={contractAddress}
            roleKey={rk}
            account={member.walletAddress as Address}
            scope={config.scope}
            chainId={chainId}
          />
        ))}
      </div>
    </div>
  );
}

export function MemberMatrix({ config }: { config: AccessManagerConfig }) {
  const roleKeys = config.roles.map((r) => r.key);

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base">Member matrix</CardTitle>
        <CardDescription>
          Wallet addresses vs on-chain roles for this AccessManager scope.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto rounded-lg border">
          <div className="min-w-[640px]">
            <div className="flex border-b bg-muted/80">
              <div className="w-48 shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-wide">
                Member
              </div>
              <div className="flex flex-1">
                {roleKeys.map((key) => (
                  <div
                    key={key}
                    className="min-w-[72px] flex-1 px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wide leading-tight border-l border-border/60"
                  >
                    {key}
                  </div>
                ))}
              </div>
            </div>

            {config.members.map((m) => (
              <MemberRow key={m.id} member={m} roleKeys={roleKeys} config={config} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
