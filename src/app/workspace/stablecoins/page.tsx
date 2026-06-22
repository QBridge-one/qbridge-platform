"use client";

// ============================================================
// app/workspace/stablecoins/page.tsx
// Issuer's deployed stablecoin tokens — chain-backed, filtered from the
// shared TokenRegistry by product category (see lib/products/). Read-only
// for now: issuance / reserve-attestation / redemption UIs come next.
// ============================================================

import { useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Coins, RefreshCw, ExternalLink, Copy, Wallet, Inbox, ArrowRight, PlusCircle,
} from "lucide-react";
import { useWallet } from "@/lib/hooks/useWallet";
import { useContracts, useContractAddress } from "@/lib/hooks/useContracts";
import { useIssuerTokens, type IssuerTokenRow } from "@/lib/hooks/useIssuerTokens";
import { productByCategoryHash, getProduct } from "@/lib/products";
import { shortAddress } from "@/lib/contracts/deal-labels";
import { explorerAddressUrl } from "@/lib/explorer-urls";

const STABLECOIN = getProduct("stablecoin");

export default function StablecoinsPage() {
  const { address } = useWallet();
  const { chainId, tokenRegistry } = useContracts();
  const { rows, isLoading, isError, refetch } = useIssuerTokens(address);
  // Reference/demo instance (Acme USD on Sepolia) wired in lib/contracts/registry.ts.
  const referenceToken = useContractAddress("stablecoinToken");

  const stablecoins = useMemo(
    () =>
      rows
        .filter((r) => productByCategoryHash(r.category)?.key === "stablecoin")
        .sort((a, b) => b.deployedAt - a.deployedAt),
    [rows],
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stablecoins</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{STABLECOIN.tagline}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <Link href="/workspace/stablecoins/new">
              <PlusCircle className="mr-1.5 h-4 w-4" />
              New stablecoin
            </Link>
          </Button>
        </div>
      </div>

      {/* Reference / demo instance */}
      {referenceToken && (
        <Card className="border-dashed">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                <Coins className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Reference instance (demo)</p>
                <p className="font-mono text-xs text-muted-foreground">{shortAddress(referenceToken)}</p>
              </div>
            </div>
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/workspace/stablecoins/${referenceToken}`}>
                View proof-of-reserves
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Body */}
      {!address ? (
        <EmptyState icon={Wallet} title="Connect your wallet" hint="Connect the issuer wallet to see your deployed stablecoins." />
      ) : !tokenRegistry ? (
        <EmptyState
          icon={Inbox}
          title="Network not configured"
          hint={`TokenRegistry isn't configured for chain ${chainId}. Switch your wallet to Sepolia (11155111).`}
        />
      ) : isLoading && rows.length === 0 ? (
        <TableShell><SkeletonRows /></TableShell>
      ) : stablecoins.length === 0 ? (
        <EmptyState
          icon={Coins}
          title="No stablecoins yet"
          hint="Stablecoins you issue will appear here. Issuance is gated by on-chain proof-of-reserves."
          action={
            <Button asChild size="sm">
              <Link href="/workspace/stablecoins/new">
                <PlusCircle className="mr-1.5 h-4 w-4" />
                New stablecoin
              </Link>
            </Button>
          }
        />
      ) : (
        <TableShell>
          {stablecoins.map((r) => (
            <StablecoinRow key={r.token} row={r} chainId={chainId} />
          ))}
        </TableShell>
      )}

      <p className="text-xs text-muted-foreground">
        {stablecoins.length} stablecoin{stablecoins.length === 1 ? "" : "s"} · read live from TokenRegistry
      </p>
      {isError && (
        <p className="text-xs text-destructive">
          Couldn&apos;t read from the network — check your connection and hit Refresh.
        </p>
      )}
    </div>
  );
}

// ─── Table shell ──────────────────────────────────────────────
function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Stablecoin</TableHead>
            <TableHead>Deployed</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Token</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────
function StablecoinRow({ row, chainId }: { row: IssuerTokenRow; chainId: number }) {
  const explorer = explorerAddressUrl(chainId, row.token);
  const deployed = row.deployedAt
    ? new Date(row.deployedAt * 1000).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "—";

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Coins className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{row.name || "Untitled stablecoin"}</p>
            <p className="font-mono text-xs text-muted-foreground">{row.symbol || shortAddress(row.token)}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{deployed}</TableCell>
      <TableCell>
        {row.delisted ? (
          <Badge variant="secondary" className="text-muted-foreground">Delisted</Badge>
        ) : (
          <Badge className="border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Listed</Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs">{shortAddress(row.token)}</span>
          <CopyButton value={row.token} />
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/workspace/stablecoins/${row.token}`}>View</Link>
          </Button>
          {explorer && (
            <Button variant="ghost" size="sm" asChild>
              <a href={explorer} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="sr-only">View on explorer</span>
              </a>
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
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

// ─── States ───────────────────────────────────────────────────
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 5 }).map((__, j) => (
            <TableCell key={j}><div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-muted" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: React.ElementType;
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 max-w-sm text-sm text-muted-foreground">{hint}</p>
      </div>
      {action}
    </div>
  );
}
