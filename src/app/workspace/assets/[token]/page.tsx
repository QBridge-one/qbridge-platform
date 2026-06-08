"use client";

// ============================================================
// app/workspace/assets/[token]/page.tsx
// Deal detail — chain-backed view of one deployed deal token and its
// full cluster (factory.getDeployedDeal). [token] = token address.
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
  ArrowLeft, Building2, Copy, ExternalLink, RefreshCw, Inbox,
} from "lucide-react";
import { useContracts } from "@/lib/hooks/useContracts";
import { useDealDetail } from "@/lib/hooks/useDealDetail";
import { decodeAssetType, decodeCategory, shortAddress } from "@/lib/contracts/deal-labels";
import { DEAL_CLUSTER_LABELS } from "@/types/deal";
import { explorerAddressUrl } from "@/lib/explorer-urls";
import type { Address } from "@/lib/core/types";

export default function DealDetailPage() {
  const params = useParams<{ token: string }>();
  const raw = params?.token ?? "";
  const valid = isAddress(raw);
  const token = (valid ? raw : null) as Address | null;

  const { chainId } = useContracts();
  const { found, record, name, symbol, decimals, totalSupply, cluster, isLoading, refetch } =
    useDealDetail(token);

  return (
    <div className="space-y-6 p-6">
      {/* Back */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/workspace/assets">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Assets
          </Link>
        </Button>
        {token && (
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>

      {!valid ? (
        <Empty title="Invalid address" hint="This URL isn't a valid token address." />
      ) : isLoading && !found ? (
        <Empty title="Loading…" hint="Reading the deal from chain." />
      ) : !found ? (
        <Empty title="Deal not found" hint="No registered token at this address on the current network." />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{name || "Untitled deal"}</h1>
                {symbol && <span className="font-mono text-sm text-muted-foreground">{symbol}</span>}
                {record?.delisted ? (
                  <Badge variant="secondary" className="text-muted-foreground">Delisted</Badge>
                ) : (
                  <Badge className="border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Listed</Badge>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{decodeAssetType(record?.assetType)}</Badge>
                <span>{decodeCategory(record?.category)}</span>
              </div>
            </div>
          </div>

          {/* Key facts */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Total supply" value={
              totalSupply !== undefined ? formatUnits(totalSupply, decimals ?? 18) : "—"
            } />
            <Fact label="Decimals" value={decimals !== undefined ? String(decimals) : "—"} />
            <Fact label="Deployed" value={
              record?.deployedAt ? new Date(Number(record.deployedAt) * 1000).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—"
            } />
            <Fact label="Issuer" value={shortAddress(record?.issuer)} mono />
          </div>

          {/* Cluster */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Deployed cluster</CardTitle>
            </CardHeader>
            <CardContent>
              {!cluster ? (
                <p className="text-sm text-muted-foreground">
                  Cluster addresses unavailable for this token (it may not have been
                  deployed through the platform factory).
                </p>
              ) : (
                <dl className="divide-y">
                  <AddressRow label="Token" value={token!} chainId={chainId} />
                  {Object.entries(DEAL_CLUSTER_LABELS)
                    .filter(([key]) => key !== "token")
                    .map(([key, label]) => (
                      <AddressRow
                        key={key}
                        label={label}
                        value={cluster[key as keyof typeof cluster] as Address}
                        chainId={chainId}
                      />
                    ))}
                </dl>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Bits ─────────────────────────────────────────────────────
function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 truncate text-lg font-semibold ${mono ? "font-mono text-sm" : ""}`}>{value}</p>
    </div>
  );
}

function AddressRow({ label, value, chainId }: { label: string; value: Address; chainId: number }) {
  const explorer = explorerAddressUrl(chainId, value);
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1.5">
        <span className="font-mono text-xs">{shortAddress(value)}</span>
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
      </dd>
    </div>
  );
}

function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 max-w-sm text-sm text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}
