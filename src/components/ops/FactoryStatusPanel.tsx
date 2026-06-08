"use client";

// ============================================================
// components/ops/FactoryStatusPanel.tsx
//
// Ops view of the deal factory: live status (paused?, deal count,
// wired registries/authority, implementation templates) + pause /
// unpause controls. Composes the generated factory hooks.
//
// pauseFactory/unpauseFactory are AccessManager-restricted on-chain —
// the connected wallet needs the configured role (or SUPER_ADMIN) or
// the tx reverts.
// ============================================================

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Pause, Play, Copy, ExternalLink, RefreshCw, ShieldAlert } from "lucide-react";
import { useContracts, useFactoryAddress } from "@/lib/hooks/useContracts";
import {
  useIsPaused,
  useDealCount,
  useImplementations,
  useIssuerRegistry,
  useTokenRegistry,
  useAuthority,
  useUpgradeAuthority,
  usePauseFactory,
  useUnpauseFactory,
} from "@/lib/generated/factory";
import { shortAddress } from "@/lib/contracts/deal-labels";
import { explorerAddressUrl } from "@/lib/explorer-urls";
import type { Address } from "@/lib/core/types";

export function FactoryStatusPanel() {
  const { chainId } = useContracts();
  const factory = useFactoryAddress();

  const isPaused = useIsPaused(undefined);
  const dealCount = useDealCount(undefined);
  const impls = useImplementations(undefined);
  const issuerReg = useIssuerRegistry(undefined);
  const tokenReg = useTokenRegistry(undefined);
  const authority = useAuthority(undefined);
  const upgradeAuth = useUpgradeAuthority(undefined);

  const paused = isPaused.data as boolean | undefined;
  const count = dealCount.data as bigint | undefined;
  const i = impls.data as
    | {
        identityRegistry: Address;
        complianceChecker: Address;
        navOracle: Address;
        token: Address;
        distributionSettlement: Address;
        capitalCallManager: Address;
      }
    | undefined;

  const { pauseFactory, isLoading: pausing, error: pauseErr } = usePauseFactory();
  const { unpauseFactory, isLoading: unpausing, error: unpauseErr } = useUnpauseFactory();
  const [reason, setReason] = useState("");

  const refetchAll = () => {
    isPaused.refetch();
    dealCount.refetch();
  };

  const onPause = async () => {
    try {
      await pauseFactory({ reason: reason.trim() || "Paused via ops console" });
      setReason("");
      isPaused.refetch();
    } catch {
      /* surfaced via error */
    }
  };
  const onUnpause = async () => {
    try {
      await unpauseFactory();
      isPaused.refetch();
    } catch {
      /* surfaced via error */
    }
  };

  if (!factory) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Factory isn&apos;t configured for chain {chainId}. Switch to a supported network.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Factory status</CardTitle>
            <CardDescription className="text-xs">SingleSpvRealEstateFactory</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={refetchAll}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isPaused.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs text-muted-foreground">State</p>
              <div className="mt-1">
                {paused === undefined ? (
                  <Badge variant="secondary">…</Badge>
                ) : paused ? (
                  <Badge className="border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400">Paused</Badge>
                ) : (
                  <Badge className="border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Active</Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Deals deployed</p>
              <p className="mt-1 text-lg font-semibold">{count === undefined ? "—" : count.toString()}</p>
            </div>
          </div>

          <dl className="divide-y border-t pt-1">
            <AddressLine label="Factory" value={factory} chainId={chainId} />
            <AddressLine label="Authority (AccessManager)" value={authority.data as Address | undefined} chainId={chainId} />
            <AddressLine label="Upgrade authority" value={upgradeAuth.data as Address | undefined} chainId={chainId} />
            <AddressLine label="Issuer registry" value={issuerReg.data as Address | undefined} chainId={chainId} />
            <AddressLine label="Token registry" value={tokenReg.data as Address | undefined} chainId={chainId} />
          </dl>
        </CardContent>
      </Card>

      {/* Implementation templates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Implementation templates</CardTitle>
          <CardDescription className="text-xs">Cloned per deal by the factory.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            <AddressLine label="Token" value={i?.token} chainId={chainId} />
            <AddressLine label="Identity registry" value={i?.identityRegistry} chainId={chainId} />
            <AddressLine label="Compliance checker" value={i?.complianceChecker} chainId={chainId} />
            <AddressLine label="NAV oracle" value={i?.navOracle} chainId={chainId} />
            <AddressLine label="Distribution settlement" value={i?.distributionSettlement} chainId={chainId} />
            <AddressLine label="Capital-call manager" value={i?.capitalCallManager} chainId={chainId} />
          </dl>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Controls</CardTitle>
          <CardDescription className="text-xs">
            Pausing halts new deal deployments (createDeal reverts) until unpaused.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paused ? (
            <Button onClick={onUnpause} disabled={unpausing}>
              {unpausing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Unpause factory
            </Button>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[220px]">
                <label className="mb-1.5 block text-sm font-medium">Reason</label>
                <Input
                  placeholder="Why are you pausing? (audit log)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <Button variant="destructive" onClick={onPause} disabled={pausing}>
                {pausing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pause className="mr-2 h-4 w-4" />}
                Pause factory
              </Button>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-md border border-amber-500/40 p-3 text-xs text-amber-600 dark:text-amber-400">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Requires a wallet with the factory&apos;s pause role (or SUPER_ADMIN) on the PlatformAccessManager.</span>
          </div>

          {(pauseErr || unpauseErr) && (
            <p className="text-sm text-destructive">{(pauseErr ?? unpauseErr)?.message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AddressLine({ label, value, chainId }: { label: string; value?: Address; chainId: number }) {
  const explorer = value ? explorerAddressUrl(chainId, value) : null;
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1.5">
        <span className="font-mono text-xs">{shortAddress(value)}</span>
        {value && (
          <>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(value)}
              className="text-muted-foreground transition-colors hover:text-foreground"
              title="Copy"
            >
              <Copy className="h-3 w-3" />
            </button>
            {explorer && (
              <a href={explorer} target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground" title="Explorer">
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </>
        )}
      </dd>
    </div>
  );
}
