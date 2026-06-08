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
  BarChart2,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { TotalAssetsStat } from "@/components/dashboard/total-assets-stat";
import { RecentDealsCard } from "@/components/dashboard/recent-deals-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Overview",
};

// ─── Mock data — replace with real API/contract calls ─────────

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
        <TotalAssetsStat />
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
        <RecentDealsCard />

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
