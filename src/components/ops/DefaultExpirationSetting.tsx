"use client";

// ============================================================
// DefaultExpirationSetting
// Ops platform setting: IssuerRegistry.defaultExpirationDuration — the
// GLOBAL default validity *duration* (seconds) applied to future
// registerIssuer / migrateWallet calls. Not per-issuer, and not
// retroactive. On-chain write via transactionService (same pre-sign
// confirmation + revert handling as the issuer lifecycle actions).
//
// The contract's AccessManager is the real gate; an ops wallet without
// the role will fail the server-side simulation in /api/tx/prepare.
// ============================================================

import { useState } from "react";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { useChainId, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Hex } from "@/lib/core/types";
import { useIssuerRegistryAddress } from "@/lib/hooks/useContracts";
import {
  useDefaultExpirationDuration,
  useSetDefaultExpirationDuration,
} from "@/lib/generated/issuer-registry";
import { explorerTxUrl } from "@/lib/explorer-urls";
import { notifyTxSuccess } from "@/lib/notify-tx-success";

const EXPECTED_CHAIN_ID =
  process.env.NEXT_PUBLIC_PRIVY_NETWORK === "mainnet" ? 1 : 11155111;
const CHAIN_NAME = EXPECTED_CHAIN_ID === 1 ? "Ethereum" : "Sepolia";
const SECONDS_PER_DAY = 86_400;

const PRESETS = [
  { label: "1 year", days: 365 },
  { label: "2 years", days: 730 },
  { label: "3 years", days: 1095 },
] as const;

/** Human-friendly rendering of a duration in seconds. */
function formatDuration(seconds: bigint): string {
  const s = Number(seconds);
  if (!Number.isFinite(s) || s <= 0) return "—";
  const days = Math.round(s / SECONDS_PER_DAY);
  if (days >= 365 && days % 365 === 0) {
    const years = days / 365;
    return `${days} days (~${years} year${years === 1 ? "" : "s"})`;
  }
  return `${days} day${days === 1 ? "" : "s"}`;
}

export function DefaultExpirationSetting() {
  const registryAddress = useIssuerRegistryAddress();
  const walletChainId = useChainId();
  const wrongChain = walletChainId !== EXPECTED_CHAIN_ID;
  const { switchChain, isPending: switching } = useSwitchChain();

  const {
    data: current,
    isLoading: reading,
    refetch,
  } = useDefaultExpirationDuration(registryAddress, EXPECTED_CHAIN_ID);

  const {
    setDefaultExpirationDuration,
    isLoading: saving,
    error: saveError,
    reset,
  } = useSetDefaultExpirationDuration();

  const [days, setDays] = useState("365");
  const [localError, setLocalError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hex | null>(null);

  const currentSeconds = typeof current === "bigint" ? current : null;
  const parsedDays = Number(days);
  const validDays = Number.isInteger(parsedDays) && parsedDays > 0;
  const newSeconds = validDays ? BigInt(parsedDays) * BigInt(SECONDS_PER_DAY) : null;
  const unchanged =
    newSeconds !== null && currentSeconds !== null && newSeconds === currentSeconds;

  const canSave = !!registryAddress && !wrongChain && !saving && validDays && !unchanged;

  async function handleSave() {
    if (!newSeconds || wrongChain) return;
    setLocalError(null);
    setTxHash(null);
    reset();
    try {
      const hash = await setDefaultExpirationDuration({ newDuration: newSeconds });
      if (hash) {
        const h = hash as Hex;
        setTxHash(h);
        notifyTxSuccess("Default expiration updated", EXPECTED_CHAIN_ID, h);
        await refetch();
      }
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Update failed");
    }
  }

  const errMsg = localError ?? saveError?.message;
  const txUrl = txHash ? explorerTxUrl(EXPECTED_CHAIN_ID, txHash) : null;

  if (!registryAddress) {
    return (
      <p className="text-sm text-muted-foreground">
        IssuerRegistry is not configured for this chain.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm">
        <span className="text-muted-foreground">Current default: </span>
        <span className="font-medium">
          {reading
            ? "Reading…"
            : currentSeconds !== null
              ? formatDuration(currentSeconds)
              : "—"}
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="exp-days" className="text-xs">
          New duration (days)
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="exp-days"
            type="number"
            min={1}
            inputMode="numeric"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-32"
          />
          {PRESETS.map((p) => (
            <Button
              key={p.days}
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setDays(String(p.days))}
            >
              {p.label}
            </Button>
          ))}
        </div>
        {newSeconds !== null ? (
          <p className="text-xs text-muted-foreground">
            = {newSeconds.toString()} seconds{unchanged ? " (unchanged)" : ""}
          </p>
        ) : (
          <p className="text-xs text-destructive">
            Enter a whole number of days greater than 0.
          </p>
        )}
      </div>

      {wrongChain ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-amber-400/40 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
          <span>Wrong network — IssuerRegistry lives on {CHAIN_NAME}.</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[11px]"
            disabled={switching}
            onClick={() => switchChain({ chainId: EXPECTED_CHAIN_ID })}
          >
            {switching ? "Switching…" : `Switch to ${CHAIN_NAME}`}
          </Button>
        </div>
      ) : null}

      {errMsg ? <p className="text-xs text-destructive">{errMsg}</p> : null}

      {txHash ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
          <CheckCircle2
            className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          <span>Default expiration updated.</span>
          {txUrl ? (
            <a
              href={txUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 underline underline-offset-2"
            >
              View transaction
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      ) : null}

      <Button type="button" disabled={!canSave} onClick={() => void handleSave()}>
        {saving ? (
          <>
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Update default expiration"
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        Applies to future registrations and wallet migrations only — existing issuers keep
        their current expiry.
      </p>
    </div>
  );
}
