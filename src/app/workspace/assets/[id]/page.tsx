"use client";

// ============================================================
// app/workspace/assets/[id]/page.tsx
// Asset detail — overview, token state, recent ops, investors
// ============================================================

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_ASSETS, MOCK_TOKEN_OPS, MOCK_INVESTORS } from "@/lib/mock-data";
import { ASSET_TYPE_LABELS } from "@/types/assets";
import { AssetStatusBadge } from "@/components/dashboard/asset-status-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2, Landmark, Wheat, Coins,
  ArrowLeft, ExternalLink, Copy,
  Pause, Play, Zap, Shield,
  Users, FileText, Activity,
  ShieldAlert, TrendingUp, Hash,
} from "lucide-react";
import type { AssetType } from "@/types/assets";
import type { TokenOperation } from "@/types/db";

const ASSET_ICONS: Record<AssetType, React.ElementType> = {
  REAL_ESTATE: Building2,
  PRIVATE_CREDIT: Landmark,
  COMMODITY: Wheat,
  STABLECOIN: Coins,
};

const OP_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  MINT:             { label: "Mint",            color: "text-emerald-600 dark:text-emerald-400" },
  BURN:             { label: "Burn",            color: "text-red-600 dark:text-red-400" },
  FORCE_TRANSFER:   { label: "Force Transfer",  color: "text-amber-600 dark:text-amber-400" },
  FORCE_BURN:       { label: "Force Burn",      color: "text-red-700 dark:text-red-300" },
  FREEZE:           { label: "Freeze",          color: "text-blue-600 dark:text-blue-400" },
  UNFREEZE:         { label: "Unfreeze",        color: "text-emerald-600 dark:text-emerald-400" },
  PARTIAL_FREEZE:   { label: "Partial Freeze",  color: "text-blue-500 dark:text-blue-300" },
  PAUSE:            { label: "Pause",           color: "text-amber-600 dark:text-amber-400" },
  UNPAUSE:          { label: "Unpause",         color: "text-emerald-600 dark:text-emerald-400" },
  EMERGENCY_PAUSE:  { label: "Emergency Pause", color: "text-red-600 dark:text-red-400" },
  TRANSFER:         { label: "Transfer",        color: "text-muted-foreground" },
};

function shortAddr(addr?: string) {
  if (!addr) return "—";
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

function CopyableAddress({ address }: { address: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 font-mono text-xs hover:text-foreground text-muted-foreground transition-colors"
      onClick={() => navigator.clipboard.writeText(address)}
      title="Copy address"
    >
      {shortAddr(address)}
      <Copy className="h-3 w-3" />
    </button>
  );
}

export default function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const asset = MOCK_ASSETS.find((a) => a.id === id);
  if (!asset) notFound();

  const Icon = ASSET_ICONS[asset.assetType];
  const isDeployed = !!asset.contractAddress;
  const isLive = asset.status === "LIVE";

  const assetOps = MOCK_TOKEN_OPS.filter((op) => op.assetId === asset.id);
  const circulatingPct =
    asset.circulatingSupply && asset.totalSupply
      ? ((Number(asset.circulatingSupply) / Number(asset.totalSupply)) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6 p-6">
      {/* ── Breadcrumb + Header ── */}
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/workspace/assets">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Assets
          </Link>
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-muted shadow-sm">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{asset.name}</h1>
                <Badge variant="outline" className="font-mono text-xs">{asset.symbol}</Badge>
                <AssetStatusBadge status={asset.status} />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {ASSET_TYPE_LABELS[asset.assetType]} · {asset.jurisdiction} ·{" "}
                {asset.issuerLegalName}
              </p>
            </div>
          </div>

          {/* Action buttons — only for live/deployed assets */}
          {isDeployed && (
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/workspace/tokens?asset=${asset.id}`}>
                  <Coins className="mr-1.5 h-4 w-4" />
                  Token Ops
                </Link>
              </Button>
              {isLive ? (
                <Button variant="outline" size="sm" className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                  <Pause className="mr-1.5 h-4 w-4" />
                  Pause
                </Button>
              ) : asset.status === "PAUSED" ? (
                <Button variant="outline" size="sm" className="text-emerald-600">
                  <Play className="mr-1.5 h-4 w-4" />
                  Unpause
                </Button>
              ) : null}
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://sepolia.etherscan.io/address/${asset.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  Etherscan
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Circulating Supply"
          value={asset.circulatingSupply
            ? `${(Number(asset.circulatingSupply) / 1_000_000).toFixed(2)}M`
            : "Not deployed"}
          subtitle={isDeployed ? `${circulatingPct}% of total` : undefined}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Supply"
          value={`${(Number(asset.totalSupply) / 1_000_000).toFixed(1)}M`}
          subtitle={`${asset.currency} ${asset.pricePerToken} / token`}
          icon={Coins}
        />
        <StatCard
          title="Investors"
          value={asset.investorCount?.toLocaleString() ?? "—"}
          subtitle={asset.frozenAccountCount ? `${asset.frozenAccountCount} frozen` : "None frozen"}
          icon={Users}
          badge={asset.frozenAccountCount ? { label: `${asset.frozenAccountCount} Frozen`, variant: "destructive" } : undefined}
        />
        <StatCard
          title="AUM"
          value={asset.circulatingSupply
            ? `${asset.currency} ${((Number(asset.circulatingSupply) * Number(asset.pricePerToken)) / 1_000_000).toFixed(1)}M`
            : "—"}
          subtitle="At token price"
          icon={TrendingUp}
        />
      </div>

      {/* ── Pause banners ── */}
      {asset.isEmergencyPaused && (
        <div className="flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 px-4 py-3">
          <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">Emergency Pause Active</p>
            <p className="text-xs text-red-600 dark:text-red-400">Platform authority has issued an emergency pause. All operations are blocked except forceTransfer and forceBurn.</p>
          </div>
        </div>
      )}
      {asset.isPaused && !asset.isEmergencyPaused && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 px-4 py-3">
          <Pause className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">Regular operations paused by token issuer.</p>
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Token details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Token Configuration</CardTitle>
              </CardHeader>
              <CardContent className="divide-y text-sm">
                {[
                  ["Standard", "Custom ERC-20 (BaseAssetToken)"],
                  ["Decimals", asset.decimals.toString()],
                  ["Total Supply", Number(asset.totalSupply).toLocaleString()],
                  ["Price Per Token", `${asset.currency} ${asset.pricePerToken}`],
                  ["Soft Cap", asset.softCap ? `${asset.currency} ${Number(asset.softCap).toLocaleString()}` : "—"],
                  ["Hard Cap", asset.hardCap ? `${asset.currency} ${Number(asset.hardCap).toLocaleString()}` : "—"],
                  ["Proof of Backing", asset.enableBacking ? "Enabled" : "Disabled"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Compliance summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Compliance Rules</CardTitle>
              </CardHeader>
              <CardContent className="divide-y text-sm">
                {[
                  ["KYC Tier", asset.kycTier],
                  ["Transfer Mode", asset.transferMode.replace("_", " ")],
                  ["Hold Period", asset.holdPeriodDays ? `${asset.holdPeriodDays} days` : "None"],
                  ["Max Investors", asset.maxInvestors?.toLocaleString() ?? "Unlimited"],
                  ["Min Investment", asset.minInvestmentAmount ? `${asset.currency} ${Number(asset.minInvestmentAmount).toLocaleString()}` : "None"],
                  ["Accredited Required", asset.requireAccreditedStatus ? "Yes" : "No"],
                  ["Allowed Jurisdictions", asset.allowedJurisdictions.length > 0 ? asset.allowedJurisdictions.join(", ") : "All"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{asset.description}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations tab */}
        <TabsContent value="operations" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm">Token Operations</CardTitle>
                <CardDescription className="text-xs">Recent on-chain events</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/workspace/tokens?asset=${asset.id}`}>
                  <Activity className="mr-1.5 h-4 w-4" />
                  All Ops
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {assetOps.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-muted-foreground">
                  <Activity className="h-6 w-6 mb-2" />
                  <p className="text-sm">No operations yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {assetOps.map((op) => (
                    <OperationRow key={op.id} op={op} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance tab */}
        <TabsContent value="compliance" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm">Compliance Status</CardTitle>
                <CardDescription className="text-xs">Investor KYC and freeze status</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/workspace/cap-table?asset=${asset.id}`}>
                  <Users className="mr-1.5 h-4 w-4" />
                  Cap Table
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {MOCK_INVESTORS.slice(0, 5).map((inv) => (
                  <div key={inv.id} className="flex items-center gap-4 px-6 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium truncate">{inv.name ?? inv.walletAddress}</span>
                        <Badge
                          variant={inv.kycStatus === "APPROVED" ? "secondary" : inv.kycStatus === "EXPIRED" ? "destructive" : "outline"}
                          className="text-[10px] h-4 px-1 shrink-0"
                        >
                          {inv.kycStatus}
                        </Badge>
                        {inv.isFullyFrozen && (
                          <Badge variant="destructive" className="text-[10px] h-4 px-1 shrink-0">Frozen</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{shortAddr(inv.walletAddress)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium">{Number(inv.balance).toLocaleString()} {asset.symbol}</p>
                      <p className="text-xs text-muted-foreground">{inv.kycTier}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts tab */}
        <TabsContent value="contracts" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Contract Addresses</CardTitle>
              <CardDescription className="text-xs">
                On-chain deployment details · Chain ID {asset.chainId}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Token Contract (BaseAssetToken)", addr: asset.contractAddress },
                { label: "Token AccessManager", addr: asset.tokenAccessManagerAddress },
                { label: "Compliance Checker", addr: asset.complianceCheckerAddress },
                { label: "Backing Verifier", addr: asset.backingVerifierAddress },
                { label: "Treasury", addr: asset.treasuryAddress },
                { label: "Issuer Wallet", addr: asset.issuerWallet },
              ].map(({ label, addr }) => (
                <div key={label} className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  {addr ? (
                    <div className="flex items-center gap-2">
                      <CopyableAddress address={addr} />
                      <a
                        href={`https://sepolia.etherscan.io/address/${addr}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Not set</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OperationRow({ op }: { op: TokenOperation }) {
  const config = OP_TYPE_CONFIG[op.type] ?? { label: op.type, color: "text-muted-foreground" };
  return (
    <div className="flex items-start gap-4 px-6 py-3.5">
      <div className="mt-0.5">
        <Hash className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
          {op.amount && (
            <span className="text-xs text-foreground font-medium">
              {Number(op.amount).toLocaleString()} tokens
            </span>
          )}
          {op.roleUsed && (
            <Badge variant="outline" className="text-[10px] h-4 px-1">{op.roleUsed}</Badge>
          )}
        </div>
        {op.reason && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{op.reason}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          {op.from && <span className="text-xs text-muted-foreground font-mono">from {shortAddr(op.from)}</span>}
          {op.to && <span className="text-xs text-muted-foreground font-mono">to {shortAddr(op.to)}</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-muted-foreground">
          {new Date(op.timestamp).toLocaleDateString()}
        </p>
        <a
          href={`https://sepolia.etherscan.io/tx/${op.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          tx ↗
        </a>
      </div>
    </div>
  );
}
