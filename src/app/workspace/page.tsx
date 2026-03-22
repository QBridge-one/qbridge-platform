// ============================================================
// app/workspace/page.tsx
// Issuer dashboard overview — stats, recent assets, alerts
// ============================================================

import { Metadata } from "next";
import Link from "next/link";
import {
  Coins,
  Users,
  ShieldCheck,
  TrendingUp,
  PlusCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Building2,
  BarChart2,
  Landmark,
  Wheat,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AssetType, AssetStatus } from "@/types/assets";

export const metadata: Metadata = {
  title: "Overview",
};

// ─── Mock data — replace with real API/contract calls ─────────

const ASSET_TYPE_ICONS: Record<AssetType, React.ElementType> = {
  REAL_ESTATE: Building2,
  PRIVATE_CREDIT: Landmark,
  COMMODITY: Wheat,
  STABLECOIN: Coins,
};

const STATUS_BADGE: Record<
  AssetStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "outline" },
  PENDING_REVIEW: { label: "Pending Review", variant: "secondary" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  DEPLOYING: { label: "Deploying", variant: "secondary" },
  LIVE: { label: "Live", variant: "default" },
  PAUSED: { label: "Paused", variant: "secondary" },
  CLOSED: { label: "Closed", variant: "outline" },
};

interface RecentAsset {
  id: string;
  name: string;
  symbol: string;
  assetType: AssetType;
  status: AssetStatus;
  totalSupply: string;
  pricePerToken: string;
  currency: string;
  createdAt: string;
  investorCount: number;
}

const RECENT_ASSETS: RecentAsset[] = [
  {
    id: "asset-1",
    name: "Toronto Commercial Tower",
    symbol: "TCT",
    assetType: "REAL_ESTATE",
    status: "LIVE",
    totalSupply: "10,000,000",
    pricePerToken: "10.00",
    currency: "CAD",
    createdAt: "2025-01-15",
    investorCount: 142,
  },
  {
    id: "asset-2",
    name: "Private Credit Fund Series A",
    symbol: "PCFA",
    assetType: "PRIVATE_CREDIT",
    status: "PENDING_REVIEW",
    totalSupply: "5,000,000",
    pricePerToken: "100.00",
    currency: "USD",
    createdAt: "2025-02-01",
    investorCount: 0,
  },
  {
    id: "asset-4",
    name: "Canadian Grain Basket",
    symbol: "CGB",
    assetType: "COMMODITY",
    status: "DRAFT",
    totalSupply: "2,500,000",
    pricePerToken: "4.00",
    currency: "CAD",
    createdAt: "2025-02-10",
    investorCount: 0,
  },
  {
    id: "asset-3",
    name: "CAD Stablecoin",
    symbol: "CADC",
    assetType: "STABLECOIN",
    status: "LIVE",
    totalSupply: "50,000,000",
    pricePerToken: "1.00",
    currency: "CAD",
    createdAt: "2024-11-01",
    investorCount: 891,
  },
];

const ALERTS = [
  {
    id: "1",
    type: "compliance",
    message: "3 investors pending KYC renewal for TCT",
    href: "/workspace/compliance",
    severity: "warning" as const,
  },
  {
    id: "2",
    type: "review",
    message: "PCFA asset pending platform compliance review",
    href: "/workspace/assets/asset-2",
    severity: "info" as const,
  },
  {
    id: "3",
    type: "frozen",
    message: "1 account frozen on CADC — regulatory hold",
    href: "/workspace/compliance",
    severity: "error" as const,
  },
];

// ─── Page ─────────────────────────────────────────────────────
export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6 p-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back — here&apos;s your portfolio at a glance.
          </p>
        </div>
        <Button asChild>
          <Link href="/workspace/assets/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Asset
          </Link>
        </Button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Assets"
          value="4"
          subtitle="2 live, 1 pending, 1 draft"
          icon={Coins}
          trend={{ value: 33, label: "vs last quarter" }}
        />
        <StatCard
          title="Total AUM"
          value="$184.1M"
          subtitle="Across all live tokens"
          icon={TrendingUp}
          trend={{ value: 12.4, label: "vs last month" }}
        />
        <StatCard
          title="Total Investors"
          value="1,033"
          subtitle="Across all assets"
          icon={Users}
          trend={{ value: 8.7, label: "vs last month" }}
        />
        <StatCard
          title="Compliance Actions"
          value="7"
          subtitle="Require attention"
          icon={ShieldCheck}
          badge={{ label: "Urgent", variant: "destructive" }}
        />
      </div>

      {/* ── Alerts ── */}
      {ALERTS.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ALERTS.map((alert, i) => (
              <div key={alert.id}>
                <Link
                  href={alert.href}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        alert.severity === "error"
                          ? "bg-destructive"
                          : alert.severity === "warning"
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      }`}
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {alert.message}
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-2" />
                </Link>
                {i < ALERTS.length - 1 && <Separator className="mt-2" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Recent assets + quick actions ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent assets — takes 2/3 width on large screens */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Recent Assets</CardTitle>
              <CardDescription className="text-xs">
                Your tokenized asset portfolio
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/workspace/assets" className="text-xs">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {RECENT_ASSETS.map((asset) => {
                const Icon = ASSET_TYPE_ICONS[asset.assetType];
                const statusConfig = STATUS_BADGE[asset.status];
                return (
                  <Link
                    key={asset.id}
                    href={`/workspace/assets/${asset.id}`}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/50 transition-colors group"
                  >
                    {/* Icon */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Name + symbol */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {asset.name}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono shrink-0">
                          {asset.symbol}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {asset.totalSupply} tokens ·{" "}
                          {asset.currency} {asset.pricePerToken}
                        </span>
                        {asset.investorCount > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {asset.investorCount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <Badge
                      variant={statusConfig.variant}
                      className="text-[10px] shrink-0"
                    >
                      {statusConfig.label}
                    </Badge>

                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription className="text-xs">
              Common issuer tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              {
                label: "Create New Asset",
                icon: PlusCircle,
                href: "/workspace/assets/new",
                description: "Start tokenization wizard",
              },
              {
                label: "Mint Tokens",
                icon: Coins,
                href: "/workspace/tokens",
                description: "Mint to treasury address",
              },
              {
                label: "Review KYC Queue",
                icon: ShieldCheck,
                href: "/workspace/compliance",
                description: "3 pending approvals",
              },
              {
                label: "Cap Table Export",
                icon: BarChart2,
                href: "/workspace/cap-table",
                description: "Download investor CSV",
              },
              {
                label: "Pending Review",
                icon: Clock,
                href: "/workspace/assets/asset-2",
                description: "PCFA awaiting approval",
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent hover:text-accent-foreground transition-colors group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{action.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
