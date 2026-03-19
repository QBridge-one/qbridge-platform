"use client";

// ============================================================
// app/dashboard/cap-table/page.tsx
// Investor cap table — searchable, filterable, sortable
// Structure ready for TanStack Table — currently uses native sort
// ============================================================

import { useState, useMemo } from "react";
import { MOCK_INVESTORS, MOCK_ASSETS } from "@/lib/mock-data";
import { KYC_TIERS } from "@/types/assets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users, Search, Download, Lock, Unlock,
  MoreHorizontal, ArrowUpDown, ChevronUp, ChevronDown,
  CheckCircle2, XCircle, AlertCircle, Clock,
  ShieldCheck, Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Investor } from "@/types/db";
import type { KycTier } from "@/types/assets";

// ─── Config ──────────────────────────────────────────────────
const KYC_STATUS_CONFIG = {
  APPROVED: { label: "Approved",   icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
  PENDING:  { label: "Pending",    icon: Clock,        color: "text-amber-600 dark:text-amber-400" },
  REJECTED: { label: "Rejected",   icon: XCircle,      color: "text-destructive" },
  EXPIRED:  { label: "Expired",    icon: AlertCircle,  color: "text-amber-600 dark:text-amber-400" },
};

type SortField = "name" | "balance" | "investedAmount" | "kycStatus" | "firstInvestmentAt";
type SortDir = "asc" | "desc";

function shortAddr(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

export default function CapTablePage() {
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState<string>("ALL");
  const [frozenFilter, setFrozenFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>("balance");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedAsset, setSelectedAsset] = useState<string>("ALL");

  const deployedAssets = MOCK_ASSETS.filter((a) => a.status === "LIVE");

  const investors = useMemo(() => {
    let list = [...MOCK_INVESTORS];

    // Filters
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (inv) =>
          inv.walletAddress.toLowerCase().includes(q) ||
          inv.name?.toLowerCase().includes(q) ||
          inv.email?.toLowerCase().includes(q) ||
          inv.legalName?.toLowerCase().includes(q)
      );
    }
    if (kycFilter !== "ALL") list = list.filter((i) => i.kycStatus === kycFilter);
    if (frozenFilter === "FROZEN") list = list.filter((i) => i.isFullyFrozen);
    if (frozenFilter === "ACTIVE") list = list.filter((i) => !i.isFullyFrozen);

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "balance") cmp = Number(a.balance) - Number(b.balance);
      else if (sortField === "investedAmount") cmp = Number(a.investedAmount) - Number(b.investedAmount);
      else if (sortField === "name") cmp = (a.name ?? a.walletAddress).localeCompare(b.name ?? b.walletAddress);
      else if (sortField === "kycStatus") cmp = a.kycStatus.localeCompare(b.kycStatus);
      else if (sortField === "firstInvestmentAt") cmp = new Date(a.firstInvestmentAt).getTime() - new Date(b.firstInvestmentAt).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [search, kycFilter, frozenFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-primary" />
      : <ChevronDown className="h-3 w-3 text-primary" />;
  };

  // Summary
  const totalInvested = MOCK_INVESTORS.reduce((s, i) => s + Number(i.investedAmount), 0);
  const frozenCount = MOCK_INVESTORS.filter((i) => i.isFullyFrozen).length;
  const pendingKyc = MOCK_INVESTORS.filter((i) => i.kycStatus !== "APPROVED").length;

  const exportCsv = () => {
    const rows = [
      ["Wallet", "Name", "Legal Name", "KYC Status", "KYC Tier", "Balance", "Frozen", "Invested", "Jurisdiction", "First Investment"],
      ...investors.map((i) => [
        i.walletAddress, i.name ?? "", i.legalName ?? "",
        i.kycStatus, i.kycTier, i.balance, i.frozenBalance,
        i.investedAmount, i.jurisdiction, i.firstInvestmentAt,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cap-table.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cap Table</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {MOCK_INVESTORS.length} investors · {frozenCount} frozen ·{" "}
            {pendingKyc} pending KYC
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Investors</p>
                <p className="text-2xl font-bold">{MOCK_INVESTORS.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Invested</p>
                <p className="text-2xl font-bold">
                  ${(totalInvested / 1_000_000).toFixed(1)}M
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Frozen Accounts</p>
                <p className="text-2xl font-bold text-destructive">{frozenCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search wallet, name, email…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={selectedAsset} onValueChange={setSelectedAsset}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Assets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Assets</SelectItem>
            {deployedAssets.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.symbol} — {a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={kycFilter} onValueChange={setKycFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="KYC Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All KYC</SelectItem>
            {["APPROVED", "PENDING", "REJECTED", "EXPIRED"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={frozenFilter} onValueChange={setFrozenFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Freeze Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Accounts</SelectItem>
            <SelectItem value="ACTIVE">Active Only</SelectItem>
            <SelectItem value="FROZEN">Frozen Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ── */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {/* Investor */}
                  <th className="px-4 py-3 text-left">
                    <button
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => toggleSort("name")}
                    >
                      Investor <SortIcon field="name" />
                    </button>
                  </th>
                  {/* KYC */}
                  <th className="px-4 py-3 text-left">
                    <button
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => toggleSort("kycStatus")}
                    >
                      KYC <SortIcon field="kycStatus" />
                    </button>
                  </th>
                  {/* Balance */}
                  <th className="px-4 py-3 text-right">
                    <button
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground ml-auto"
                      onClick={() => toggleSort("balance")}
                    >
                      Balance <SortIcon field="balance" />
                    </button>
                  </th>
                  {/* Invested */}
                  <th className="px-4 py-3 text-right">
                    <button
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground ml-auto"
                      onClick={() => toggleSort("investedAmount")}
                    >
                      Invested <SortIcon field="investedAmount" />
                    </button>
                  </th>
                  {/* Date */}
                  <th className="px-4 py-3 text-right hidden md:table-cell">
                    <button
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground ml-auto"
                      onClick={() => toggleSort("firstInvestmentAt")}
                    >
                      Since <SortIcon field="firstInvestmentAt" />
                    </button>
                  </th>
                  {/* Actions */}
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {investors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      No investors match your filters
                    </td>
                  </tr>
                ) : (
                  investors.map((inv) => (
                    <InvestorRow key={inv.id} investor={inv} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {investors.length} of {MOCK_INVESTORS.length} investors
            </p>
            <p className="text-xs text-muted-foreground">
              Replace with TanStack Table for pagination + virtual scrolling
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Investor Row ─────────────────────────────────────────────
function InvestorRow({ investor }: { investor: Investor }) {
  const kycConf = KYC_STATUS_CONFIG[investor.kycStatus];
  const KycIcon = kycConf.icon;

  return (
    <tr className={cn(
      "group hover:bg-muted/40 transition-colors",
      investor.isFullyFrozen && "bg-blue-50/50 dark:bg-blue-950/10"
    )}>
      {/* Investor identity */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {investor.name ? investor.name.charAt(0).toUpperCase() : "?"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium truncate max-w-[160px]">
                {investor.legalName ?? investor.name ?? "Anonymous"}
              </span>
              {investor.isFullyFrozen && (
                <Badge variant="destructive" className="text-[10px] h-4 px-1">Frozen</Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-mono text-muted-foreground">
                {shortAddr(investor.walletAddress)}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(investor.walletAddress)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Copy className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </td>

      {/* KYC */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <KycIcon className={cn("h-3.5 w-3.5 shrink-0", kycConf.color)} />
          <span className={cn("text-xs font-medium", kycConf.color)}>{kycConf.label}</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{investor.kycTier}</p>
      </td>

      {/* Balance */}
      <td className="px-4 py-3 text-right">
        <p className="text-xs font-medium">{Number(investor.balance).toLocaleString()}</p>
        {Number(investor.frozenBalance) > 0 && (
          <p className="text-[10px] text-blue-600 dark:text-blue-400">
            {Number(investor.frozenBalance).toLocaleString()} frozen
          </p>
        )}
      </td>

      {/* Invested */}
      <td className="px-4 py-3 text-right">
        <p className="text-xs font-medium">
          ${Number(investor.investedAmount).toLocaleString()}
        </p>
        <p className="text-[10px] text-muted-foreground">{investor.jurisdiction}</p>
      </td>

      {/* Date */}
      <td className="px-4 py-3 text-right hidden md:table-cell">
        <p className="text-xs text-muted-foreground">
          {new Date(investor.firstInvestmentAt).toLocaleDateString()}
        </p>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(investor.walletAddress)}>
              Copy Wallet
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {investor.isFullyFrozen ? (
              <DropdownMenuItem className="text-emerald-600 dark:text-emerald-400">
                <Unlock className="mr-2 h-4 w-4" />
                Unfreeze Account
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="text-blue-600 dark:text-blue-400">
                <Lock className="mr-2 h-4 w-4" />
                Freeze Account
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>View on Etherscan</DropdownMenuItem>
            {investor.kycStatus !== "APPROVED" && (
              <DropdownMenuItem className="text-amber-600">Request KYC Renewal</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
