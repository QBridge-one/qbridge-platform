"use client";

// ============================================================
// app/workspace/stablecoins/[token]/page.tsx
// Stablecoin detail — read-only, chain-backed proof-of-reserves view of
// one StablecoinToken + its ReserveOracle. [token] = token address.
// Issuance / reserve-attestation / redemption actions come next.
// ============================================================

import { useParams } from "next/navigation";
import Link from "next/link";
import { isAddress, formatUnits } from "viem";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Coins, Copy, ExternalLink, RefreshCw, ShieldCheck, AlertTriangle, PauseCircle,
} from "lucide-react";
import { useContracts } from "@/lib/hooks/useContracts";
import { useStablecoinSummary } from "@/lib/hooks/useStablecoinSummary";
import { StablecoinManagePanel } from "./_components/manage-panel";
import { shortAddress } from "@/lib/contracts/deal-labels";
import { explorerAddressUrl } from "@/lib/explorer-urls";
import type { Address } from "@/lib/core/types";

// Format a base-unit amount with the token's decimals and thousands separators.
function fmt(value: bigint | undefined, decimals: number | undefined): string {
  if (value === undefined || decimals === undefined) return "—";
  const whole = formatUnits(value, decimals);
  const [int, frac] = whole.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac && frac !== "0" ? `${grouped}.${frac.slice(0, 2)}` : grouped;
}

export default function StablecoinDetailPage() {
  const params = useParams<{ token: string }>();
  const raw = params?.token ?? "";
  const valid = isAddress(raw);
  const token = (valid ? raw : null) as Address | null;

  const { chainId } = useContracts();
  const s = useStablecoinSummary(token);

  // Coverage: how much of attested reserves is already issued (supply / reserves).
  const coveragePct =
    s.attestedReserves && s.attestedReserves > BigInt(0) && s.totalSupply !== undefined
      ? Number((s.totalSupply * BigInt(10000)) / s.attestedReserves) / 100
      : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Back */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/workspace/stablecoins">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Stablecoins
          </Link>
        </Button>
        {token && (
          <Button variant="outline" size="sm" onClick={s.refetch} disabled={s.isLoading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${s.isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>

      {!valid ? (
        <Empty title="Invalid address" hint="This URL isn't a valid token address." />
      ) : s.isLoading && s.name === undefined ? (
        <Empty title="Loading…" hint="Reading the stablecoin from chain." />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Coins className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{s.name || "Stablecoin"}</h1>
                {s.symbol && <Badge variant="outline">{s.symbol}</Badge>}
                {s.paused && (
                  <Badge variant="secondary" className="gap-1 text-amber-600 dark:text-amber-400">
                    <PauseCircle className="h-3 w-3" /> Paused
                  </Badge>
                )}
                {s.reservesStale && (
                  <Badge variant="secondary" className="gap-1 text-destructive">
                    <AlertTriangle className="h-3 w-3" /> Reserves stale
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="font-mono text-xs text-muted-foreground">{token}</span>
                <CopyButton value={token!} />
                {explorerAddressUrl(chainId, token!) && (
                  <a
                    href={explorerAddressUrl(chainId, token!)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Proof-of-reserves */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Proof of reserves
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {!s.hasAttestation ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  No reserve attestation has landed yet — issuance is blocked until reserves are
                  attested. The proof-of-reserves gate forbids supply from exceeding attested
                  reserves.
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Metric label="Attested reserves" value={fmt(s.attestedReserves, s.decimals)} unit={s.symbol} />
                    <Metric label="Circulating supply" value={fmt(s.totalSupply, s.decimals)} unit={s.symbol} />
                    <Metric label="Mintable headroom" value={fmt(s.mintableHeadroom, s.decimals)} unit={s.symbol} accent />
                  </div>

                  {/* Coverage bar: supply vs attested reserves */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Issued against reserves</span>
                      <span>{coveragePct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, coveragePct)}%` }}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="text-xs text-muted-foreground">
                Freshness window:{" "}
                {s.maxAttestationAge !== undefined
                  ? s.maxAttestationAge > BigInt(0)
                    ? `${s.maxAttestationAge.toString()}s`
                    : "disabled"
                  : "—"}
              </div>
            </CardContent>
          </Card>

          {/* Cluster addresses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contracts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <AddressRow label="Token" address={token} chainId={chainId} />
              <AddressRow label="Reserve oracle" address={s.oracle} chainId={chainId} />
            </CardContent>
          </Card>

          {/* Operate actions (role-gated on-chain) */}
          {token && (
            <StablecoinManagePanel
              token={token}
              oracle={s.oracle}
              decimals={s.decimals}
              symbol={s.symbol}
              onChanged={s.refetch}
            />
          )}

          {s.isError && (
            <p className="text-xs text-destructive">
              Couldn&apos;t read from the network — check your connection and hit Refresh.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Pieces ───────────────────────────────────────────────────
function Metric({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${accent ? "text-primary" : ""}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}

function AddressRow({
  label,
  address,
  chainId,
}: {
  label: string;
  address: Address | null;
  chainId: number;
}) {
  const explorer = address ? explorerAddressUrl(chainId, address) : null;
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-xs">{address ? shortAddress(address) : "—"}</span>
        {address && <CopyButton value={address} />}
        {explorer && (
          <a href={explorer} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(value)}
      className="text-muted-foreground transition-colors hover:text-foreground"
      title="Copy address"
    >
      <Copy className="h-3 w-3" />
    </button>
  );
}

function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
