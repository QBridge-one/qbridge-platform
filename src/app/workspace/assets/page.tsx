"use client";

// ============================================================
// app/workspace/assets/page.tsx
// Asset list — filterable, searchable, all issuer's assets
// ============================================================

import { useState, useMemo } from "react";
import Link from "next/link";
import { MOCK_ASSETS } from "@/lib/mock-data";
import { ASSET_TYPE_LABELS, ASSET_TYPES, type AssetStatus, type AssetType } from "@/types/assets";
import { AssetStatusBadge } from "@/components/dashboard/asset-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2, Landmark, Wheat, Coins,
  PlusCircle, Search, ArrowRight,
  Users, TrendingUp, Pause, MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Asset } from "@/types/db";

const ASSET_ICONS: Record<AssetType, React.ElementType> = {
  REAL_ESTATE: Building2,
  PRIVATE_CREDIT: Landmark,
  COMMODITY: Wheat,
  STABLECOIN: Coins,
};

const ALL_STATUSES: AssetStatus[] = [
  "DRAFT", "PENDING_REVIEW", "APPROVED", "DEPLOYING", "LIVE", "PAUSED", "CLOSED", "REJECTED",
];

export default function AssetsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<AssetType | "ALL">("ALL");

  const filtered = useMemo(() => {
    return MOCK_ASSETS.filter((a) => {
      const matchSearch =
        !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.symbol.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
      const matchType = typeFilter === "ALL" || a.assetType === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [search, statusFilter, typeFilter]);

  // Summary counts
  const livCount = MOCK_ASSETS.filter((a) => a.status === "LIVE").length;
  const pendingCount = MOCK_ASSETS.filter((a) => a.status === "PENDING_REVIEW").length;
  const totalAUM = MOCK_ASSETS
    .filter((a) => a.status === "LIVE")
    .reduce((sum, a) => {
      const circ = Number(a.circulatingSupply ?? 0);
      const price = Number(a.pricePerToken ?? 0);
      return sum + circ * price;
    }, 0);

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Assets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {MOCK_ASSETS.length} assets · {livCount} live · AUM{" "}
            <span className="font-medium text-foreground">
              ${(totalAUM / 1_000_000).toFixed(1)}M
            </span>
          </p>
        </div>
        <Button asChild>
          <Link href="/workspace/assets/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Asset
          </Link>
        </Button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or symbol…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as AssetStatus | "ALL")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as AssetType | "ALL")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {ASSET_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {ASSET_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(search || statusFilter !== "ALL" || typeFilter !== "ALL") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
              setTypeFilter("ALL");
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* ── Pending notice ── */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">{pendingCount} asset{pendingCount > 1 ? "s" : ""}</span>{" "}
            pending platform compliance review — typically 2–3 business days.
          </p>
        </div>
      )}

      {/* ── Asset grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Coins className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">No assets found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your filters or{" "}
            <Link href="/workspace/assets/new" className="text-primary underline-offset-4 hover:underline">
              create a new asset
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Asset Card ───────────────────────────────────────────────
function AssetCard({ asset }: { asset: Asset }) {
  const Icon = ASSET_ICONS[asset.assetType];
  const isLive = asset.status === "LIVE";
  const circulatingPct =
    asset.circulatingSupply && asset.totalSupply
      ? (Number(asset.circulatingSupply) / Number(asset.totalSupply)) * 100
      : 0;

  return (
    <Card className="group relative flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Icon + name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{asset.name}</p>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-mono text-muted-foreground">{asset.symbol}</span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-xs text-muted-foreground">{ASSET_TYPE_LABELS[asset.assetType]}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <AssetStatusBadge status={asset.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/workspace/assets/${asset.id}`}>View Details</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/workspace/tokens?asset=${asset.id}`}>Token Ops</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/workspace/cap-table?asset=${asset.id}`}>Cap Table</Link>
                </DropdownMenuItem>
                {isLive && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-amber-600 dark:text-amber-400">
                      <Pause className="mr-2 h-4 w-4" />
                      Pause Token
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 gap-3 pb-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2.5">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Supply</p>
            <p className="text-sm font-semibold mt-0.5">
              {(Number(asset.totalSupply) / 1_000_000).toFixed(1)}M
            </p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="text-sm font-semibold mt-0.5">
              {asset.currency} {asset.pricePerToken}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Investors</p>
            <p className="text-sm font-semibold mt-0.5">
              {asset.investorCount?.toLocaleString() ?? "—"}
            </p>
          </div>
        </div>

        {/* Circulating supply bar — only for live assets */}
        {isLive && asset.circulatingSupply && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Circulating</span>
              <span>{circulatingPct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${circulatingPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Warnings */}
        {asset.isPaused && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <Pause className="h-3 w-3" />
            Regular operations paused
          </div>
        )}
        {asset.frozenAccountCount !== undefined && asset.frozenAccountCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
            {asset.frozenAccountCount} frozen account{asset.frozenAccountCount > 1 ? "s" : ""}
          </div>
        )}

        <Separator />

        {/* Footer */}
        <Link
          href={`/workspace/assets/${asset.id}`}
          className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>{asset.jurisdiction} · Decimals {asset.decimals}</span>
          <span className="flex items-center gap-1 text-primary font-medium">
            View <ArrowRight className="h-3 w-3" />
          </span>
        </Link>
      </CardContent>
    </Card>
  );
}
