"use client";

// ============================================================
// app/dashboard/compliance/page.tsx
// Compliance center — flags, KYC queue, frozen accounts
// ============================================================

import { useState } from "react";
import { MOCK_FLAGS, MOCK_INVESTORS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle, ShieldCheck, Lock, Unlock,
  CheckCircle2, Clock, XCircle, AlertCircle,
  ChevronDown, ChevronRight, MessageSquare,
  Users, Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComplianceFlag, Investor } from "@/types/db";
import type { FlagSeverity, FlagStatus } from "@/types/db";

// ─── Config ──────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<FlagSeverity, { label: string; color: string; bg: string; border: string }> = {
  LOW:      { label: "Low",      color: "text-muted-foreground",                                         bg: "bg-muted",                                                      border: "border-border" },
  MEDIUM:   { label: "Medium",  color: "text-amber-600 dark:text-amber-400",                             bg: "bg-amber-50 dark:bg-amber-950/30",                              border: "border-amber-200 dark:border-amber-900/50" },
  HIGH:     { label: "High",    color: "text-orange-600 dark:text-orange-400",                           bg: "bg-orange-50 dark:bg-orange-950/30",                            border: "border-orange-200 dark:border-orange-900/50" },
  CRITICAL: { label: "Critical", color: "text-red-600 dark:text-red-400",                                bg: "bg-red-50 dark:bg-red-950/30",                                  border: "border-red-200 dark:border-red-900/50" },
};

const FLAG_STATUS_CONFIG: Record<FlagStatus, { label: string; icon: React.ElementType; color: string }> = {
  OPEN:      { label: "Open",       icon: AlertCircle,  color: "text-destructive" },
  IN_REVIEW: { label: "In Review",  icon: Clock,        color: "text-amber-600 dark:text-amber-400" },
  RESOLVED:  { label: "Resolved",   icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
  DISMISSED: { label: "Dismissed",  icon: XCircle,      color: "text-muted-foreground" },
};

const KYC_STATUS_CONFIG = {
  APPROVED: { label: "Approved",  icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
  PENDING:  { label: "Pending",   icon: Clock,        color: "text-amber-600 dark:text-amber-400" },
  REJECTED: { label: "Rejected",  icon: XCircle,      color: "text-destructive" },
  EXPIRED:  { label: "Expired",   icon: AlertCircle,  color: "text-amber-600 dark:text-amber-400" },
};

// ─── Page ─────────────────────────────────────────────────────
export default function CompliancePage() {
  const openFlags = MOCK_FLAGS.filter((f) => f.status === "OPEN" || f.status === "IN_REVIEW");
  const resolvedFlags = MOCK_FLAGS.filter((f) => f.status === "RESOLVED" || f.status === "DISMISSED");
  const frozenInvestors = MOCK_INVESTORS.filter((i) => i.isFullyFrozen);
  const pendingKyc = MOCK_INVESTORS.filter((i) => i.kycStatus !== "APPROVED");

  const criticalCount = openFlags.filter((f) => f.severity === "CRITICAL").length;
  const highCount = openFlags.filter((f) => f.severity === "HIGH").length;

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance Center</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Active flags, KYC queue, and frozen accounts across all your assets.
        </p>
      </div>

      {/* ── Summary ── */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Open Flags",      value: openFlags.length,        color: "text-destructive",                             icon: Flag },
          { label: "Critical",        value: criticalCount,           color: "text-red-600 dark:text-red-400",              icon: AlertTriangle },
          { label: "KYC Non-Compliant", value: pendingKyc.length,    color: "text-amber-600 dark:text-amber-400",          icon: ShieldCheck },
          { label: "Frozen Accounts", value: frozenInvestors.length,  color: "text-blue-600 dark:text-blue-400",            icon: Lock },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Icon className={cn("h-5 w-5 shrink-0", color)} />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={cn("text-xl font-bold", color)}>{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="flags">
        <TabsList>
          <TabsTrigger value="flags" className="gap-1.5">
            Active Flags
            {openFlags.length > 0 && (
              <Badge variant="destructive" className="text-[10px] h-4 px-1">{openFlags.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="kyc" className="gap-1.5">
            KYC Queue
            {pendingKyc.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1">{pendingKyc.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="frozen" className="gap-1.5">
            Frozen Accounts
            {frozenInvestors.length > 0 && (
              <Badge className="text-[10px] h-4 px-1 bg-blue-600">{frozenInvestors.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Resolved</TabsTrigger>
        </TabsList>

        {/* ── ACTIVE FLAGS ── */}
        <TabsContent value="flags" className="mt-4 space-y-3">
          {openFlags.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
              <p className="text-sm font-medium">All clear — no open flags</p>
            </div>
          ) : (
            openFlags
              .sort((a, b) => {
                const order: FlagSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
                return order.indexOf(a.severity) - order.indexOf(b.severity);
              })
              .map((flag) => <FlagCard key={flag.id} flag={flag} />)
          )}
        </TabsContent>

        {/* ── KYC QUEUE ── */}
        <TabsContent value="kyc" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">KYC Non-Compliant Investors</CardTitle>
              <CardDescription className="text-xs">
                Investors with pending, expired, or rejected KYC that may require attention.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {pendingKyc.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <ShieldCheck className="h-6 w-6 text-emerald-500 mb-2" />
                  <p className="text-sm text-muted-foreground">All investors KYC approved</p>
                </div>
              ) : (
                <div className="divide-y">
                  {pendingKyc.map((inv) => <KycRow key={inv.id} investor={inv} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── FROZEN ACCOUNTS ── */}
        <TabsContent value="frozen" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Frozen Accounts</CardTitle>
              <CardDescription className="text-xs">
                Accounts with full or partial freezes. Frozen tokens cannot be transferred normally.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {frozenInvestors.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <Unlock className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No frozen accounts</p>
                </div>
              ) : (
                <div className="divide-y">
                  {frozenInvestors.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/50">
                        <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{inv.legalName ?? inv.name ?? "Anonymous"}</p>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">{inv.walletAddress.slice(0, 10)}…{inv.walletAddress.slice(-6)}</p>
                        {inv.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{inv.notes}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium">{Number(inv.frozenBalance).toLocaleString()} tokens</p>
                        <p className="text-xs text-muted-foreground">{inv.isFullyFrozen ? "Fully frozen" : "Partial"}</p>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                        <Unlock className="mr-1.5 h-3.5 w-3.5" />
                        Unfreeze
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── RESOLVED ── */}
        <TabsContent value="history" className="mt-4 space-y-3">
          {resolvedFlags.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No resolved flags yet</p>
            </div>
          ) : (
            resolvedFlags.map((flag) => <FlagCard key={flag.id} flag={flag} readonly />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Flag Card ────────────────────────────────────────────────
function FlagCard({ flag, readonly = false }: { flag: ComplianceFlag; readonly?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const sevConf = SEVERITY_CONFIG[flag.severity];
  const statusConf = FLAG_STATUS_CONFIG[flag.status];
  const StatusIcon = statusConf.icon;

  return (
    <div className={cn("rounded-xl border p-4 space-y-3", sevConf.bg, sevConf.border)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <AlertTriangle className={cn("h-4 w-4 mt-0.5 shrink-0", sevConf.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{flag.title}</p>
            <Badge
              variant="outline"
              className={cn("text-[10px] h-4 px-1.5 shrink-0", sevConf.color)}
            >
              {flag.severity}
            </Badge>
            <div className={cn("flex items-center gap-1 text-xs shrink-0", statusConf.color)}>
              <StatusIcon className="h-3 w-3" />
              {statusConf.label}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {flag.assetName}
            {flag.investorWallet && ` · ${flag.investorWallet.slice(0, 10)}…`}
            {" · "}{new Date(flag.createdAt).toLocaleDateString()}
          </p>
        </div>

        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed">{flag.description}</p>

      {/* Resolution note (if resolved) */}
      {flag.resolutionNote && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
          <span className="font-medium">Resolution: </span>{flag.resolutionNote}
        </div>
      )}

      {/* Expanded actions */}
      {expanded && !readonly && (
        <div className="space-y-3 pt-2 border-t border-current/10">
          <Textarea
            placeholder="Add resolution note…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="text-xs resize-none bg-background"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-amber-600 border-amber-300">
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              Mark In Review
            </Button>
            <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-300">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Resolve
            </Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground ml-auto">
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── KYC Row ──────────────────────────────────────────────────
function KycRow({ investor }: { investor: Investor }) {
  const conf = KYC_STATUS_CONFIG[investor.kycStatus];
  const Icon = conf.icon;

  return (
    <div className="flex items-center gap-4 px-6 py-3.5 group hover:bg-muted/30">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
        {investor.name?.charAt(0).toUpperCase() ?? "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{investor.legalName ?? investor.name ?? "Anonymous"}</p>
        </div>
        <p className="text-xs font-mono text-muted-foreground mt-0.5">
          {investor.walletAddress.slice(0, 10)}…{investor.walletAddress.slice(-6)} · {investor.jurisdiction}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Icon className={cn("h-3.5 w-3.5", conf.color)} />
        <span className={cn("text-xs font-medium", conf.color)}>{conf.label}</span>
      </div>
      {investor.kycStatus === "EXPIRED" && investor.kycExpiresAt && (
        <p className="text-xs text-muted-foreground shrink-0 hidden sm:block">
          Expired {new Date(investor.kycExpiresAt).toLocaleDateString()}
        </p>
      )}
      <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        Request Renewal
      </Button>
    </div>
  );
}
