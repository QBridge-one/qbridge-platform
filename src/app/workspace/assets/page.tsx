"use client";

// ============================================================
// app/workspace/assets/page.tsx
// Issuer's deployed deal tokens — chain-backed table (TokenRegistry).
// ============================================================

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle, Search, RefreshCw, ExternalLink, Copy, Building2, Wallet, Inbox,
} from "lucide-react";
import { useWallet } from "@/lib/hooks/useWallet";
import { useContracts } from "@/lib/hooks/useContracts";
import { useIssuerTokens, type IssuerTokenRow } from "@/lib/hooks/useIssuerTokens";
import { decodeAssetType, decodeCategory, shortAddress } from "@/lib/contracts/deal-labels";
import { REAL_ESTATE_ASSET_TYPES } from "@/types/deal";
import { explorerAddressUrl } from "@/lib/explorer-urls";

type StatusFilter = "ALL" | "LISTED" | "DELISTED";

export default function AssetsPage() {
  const { address } = useWallet();
  const { chainId, tokenRegistry } = useContracts();
  const { rows, isLoading, isError, refetch } = useIssuerTokens(address);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const filtered = useMemo(() => {
    return rows
      .filter((r) => {
        const hay = `${r.name ?? ""} ${r.symbol ?? ""} ${r.token}`.toLowerCase();
        if (search && !hay.includes(search.toLowerCase())) return false;
        if (typeFilter !== "ALL" && decodeAssetType(r.assetType) !== typeFilter) return false;
        if (statusFilter === "LISTED" && r.delisted) return false;
        if (statusFilter === "DELISTED" && !r.delisted) return false;
        return true;
      })
      .sort((a, b) => b.deployedAt - a.deployedAt);
  }, [rows, search, typeFilter, statusFilter]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <p className="text-sm text-muted-foreground">
            Deal tokens you&apos;ve deployed on-chain via the factory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <Link href="/workspace/assets/new">
              <PlusCircle className="mr-1.5 h-4 w-4" />
              New deal
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, symbol, or address…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Asset type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {REAL_ESTATE_ASSET_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.label}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="LISTED">Listed</SelectItem>
            <SelectItem value="DELISTED">Delisted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Body */}
      {!address ? (
        <EmptyState icon={Wallet} title="Connect your wallet" hint="Connect the issuer wallet to see your deployed deal tokens." />
      ) : !tokenRegistry ? (
        <EmptyState
          icon={Inbox}
          title="Network not configured"
          hint={`TokenRegistry isn't configured for chain ${chainId}. Switch your wallet to Sepolia (11155111).`}
        />
      ) : isLoading && rows.length === 0 ? (
        <TableShell><SkeletonRows /></TableShell>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No deals yet"
          hint="Deploy your first deal to tokenize an asset on-chain."
          action={<Button asChild size="sm"><Link href="/workspace/assets/new"><PlusCircle className="mr-1.5 h-4 w-4" />New deal</Link></Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Inbox} title="No matches" hint="No assets match your filters." />
      ) : (
        <TableShell>
          {filtered.map((r) => (
            <AssetRow key={r.token} row={r} chainId={chainId} />
          ))}
        </TableShell>
      )}

      <p className="text-xs text-muted-foreground">
        {rows.length} deal{rows.length === 1 ? "" : "s"} · read live from TokenRegistry
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
            <TableHead>Asset</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
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
function AssetRow({ row, chainId }: { row: IssuerTokenRow; chainId: number }) {
  const explorer = explorerAddressUrl(chainId, row.token);
  const deployed = row.deployedAt
    ? new Date(row.deployedAt * 1000).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "—";

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{row.name || "Untitled deal"}</p>
            <p className="font-mono text-xs text-muted-foreground">{row.symbol || shortAddress(row.token)}</p>
          </div>
        </div>
      </TableCell>
      <TableCell><Badge variant="outline">{decodeAssetType(row.assetType)}</Badge></TableCell>
      <TableCell className="text-sm text-muted-foreground">{decodeCategory(row.category)}</TableCell>
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
            <Link href={`/workspace/assets/${row.token}`}>View</Link>
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
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((__, j) => (
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
