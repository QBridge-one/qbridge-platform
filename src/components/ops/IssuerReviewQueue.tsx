"use client";

// ============================================================
// components/ops/IssuerReviewQueue.tsx
// Ops table for the issuer-application queue.
//
// URL drives tab + drawer state:
//   ?status=submitted|approved|rejected|all   (default "all")
//   ?focus=<orgId>                            (opens drawer)
//
// Server prefetches the visible list and (optionally) the focused
// org. This client reads the URL via useSearchParams so a soft
// navigation (bell click → ?focus=...) keeps state consistent
// without re-running useState initializers. Search and sort stay
// client-side because they're ephemeral UI state.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppOrg } from "@/lib/core/identity.types";
import type { IssuerKybStatus } from "@/lib/core/issuer-kyb";

type TabKey = "submitted" | "approved" | "rejected" | "all";
type SortKey = "name" | "legalEntity" | "jurisdiction" | "submittedAt" | "status";
type SortDir = "asc" | "desc";

const TAB_LABEL: Record<TabKey, string> = {
  all: "All",
  submitted: "Under review",
  approved: "Approved",
  rejected: "Action required",
};

const STATUS_BADGE: Partial<
  Record<IssuerKybStatus, { label: string; cls: string }>
> = {
  submitted: {
    label: "Under review",
    cls: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  },
  approved: {
    label: "Approved",
    cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  },
  rejected: {
    label: "Action required",
    cls: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  none: {
    label: "Not started",
    cls: "border-muted-foreground/30 bg-muted text-muted-foreground",
  },
  draft: {
    label: "Draft",
    cls: "border-muted-foreground/30 bg-muted text-muted-foreground",
  },
};

interface Props {
  initialOrgs: AppOrg[];
  initialTab: TabKey;
  /** Server-resolved focused org (lookup by ?focus=). When set, the
   *  drawer opens for this row regardless of which tab is active. */
  focusedOrg: AppOrg | null;
}

interface AuditRow {
  id: string;
  action: string;
  actorUserId: string;
  ts: number;
  payload: Record<string, unknown>;
}

export function IssuerReviewQueue({
  initialOrgs,
  initialTab,
  focusedOrg,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab is read from the URL so soft navigations stay in sync with
  // the server prefetch. `initialTab` is a fallback for the very
  // first paint (when useSearchParams is empty during SSR hydration).
  const tab: TabKey = useMemo(() => {
    const fromUrl = searchParams.get("status");
    if (fromUrl && isTabKey(fromUrl)) return fromUrl;
    return initialTab;
  }, [searchParams, initialTab]);

  // Search + sort are ephemeral UI state, kept client-side so a tab
  // click doesn't lose what the reviewer was filtering for.
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("submittedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Drawer selection is initialized from the server's focused org +
  // synced whenever that prop changes (e.g. bell click while already
  // on this page).
  const [selected, setSelected] = useState<AppOrg | null>(focusedOrg);
  useEffect(() => {
    setSelected(focusedOrg);
  }, [focusedOrg]);

  const onTabChange = useCallback(
    (next: string) => {
      if (!isTabKey(next)) return;
      const params = new URLSearchParams(searchParams);
      // "all" is the default — drop the param to keep URLs clean.
      if (next === "all") params.delete("status");
      else params.set("status", next);
      // Switching tabs should also drop any lingering focus so the
      // user lands in the list, not back in the drawer.
      params.delete("focus");
      const qs = params.toString();
      router.push(qs ? `/ops/admin/issuers?${qs}` : "/ops/admin/issuers");
    },
    [router, searchParams],
  );

  const onDrawerOpenChange = useCallback(
    (open: boolean) => {
      if (open) return;
      setSelected(null);
      // Strip ?focus= so a refresh doesn't reopen the drawer.
      if (searchParams.has("focus")) {
        const params = new URLSearchParams(searchParams);
        params.delete("focus");
        const qs = params.toString();
        router.replace(qs ? `/ops/admin/issuers?${qs}` : "/ops/admin/issuers");
      }
    },
    [router, searchParams],
  );

  const onDecisionSettled = useCallback(async () => {
    setSelected(null);
    if (searchParams.has("focus")) {
      const params = new URLSearchParams(searchParams);
      params.delete("focus");
      const qs = params.toString();
      router.replace(qs ? `/ops/admin/issuers?${qs}` : "/ops/admin/issuers");
    }
    // Re-render the server component so the table reflects the new
    // status of the org we just acted on (and any teammate's edits).
    router.refresh();
  }, [router, searchParams]);

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? initialOrgs.filter((o) => {
          const name = (o.name ?? "").toLowerCase();
          const legal = (o.kybApplication?.legalEntityName ?? "").toLowerCase();
          const juris = (o.kybApplication?.jurisdiction ?? "").toLowerCase();
          return name.includes(q) || legal.includes(q) || juris.includes(q);
        })
      : initialOrgs;
    const sorted = filtered.slice().sort((a, b) => {
      const cmp = compareBy(a, b, sortKey);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [initialOrgs, search, sortKey, sortDir]);

  const onSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir(key === "submittedAt" ? "desc" : "asc");
      }
    },
    [sortKey],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={tab} onValueChange={onTabChange}>
          <TabsList>
            {(Object.keys(TAB_LABEL) as TabKey[]).map((k) => (
              <TabsTrigger key={k} value={k}>
                {TAB_LABEL[k]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search company, legal entity, jurisdiction…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead
                label="Company"
                column="name"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableHead
                label="Legal entity"
                column="legalEntity"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableHead
                label="Jurisdiction"
                column="jurisdiction"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableHead
                label="Submitted"
                column="submittedAt"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableHead
                label="Status"
                column="status"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  {search
                    ? "No issuers match this search."
                    : "No issuers match this filter."}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSorted.map((o) => (
                <IssuerTableRow
                  key={o.id}
                  org={o}
                  onReview={() => setSelected(o)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ReviewSheet
        org={selected}
        onOpenChange={onDrawerOpenChange}
        onSettled={onDecisionSettled}
      />
    </div>
  );
}

function isTabKey(v: string): v is TabKey {
  return v === "all" || v === "submitted" || v === "approved" || v === "rejected";
}

function compareBy(a: AppOrg, b: AppOrg, key: SortKey): number {
  switch (key) {
    case "name":
      return (a.name ?? "").localeCompare(b.name ?? "");
    case "legalEntity":
      return (a.kybApplication?.legalEntityName ?? "").localeCompare(
        b.kybApplication?.legalEntityName ?? "",
      );
    case "jurisdiction":
      return (a.kybApplication?.jurisdiction ?? "").localeCompare(
        b.kybApplication?.jurisdiction ?? "",
      );
    case "submittedAt": {
      const ta = a.kybApplication?.submittedAt
        ? Date.parse(a.kybApplication.submittedAt)
        : Date.parse(a.createdAt);
      const tb = b.kybApplication?.submittedAt
        ? Date.parse(b.kybApplication.submittedAt)
        : Date.parse(b.createdAt);
      return ta - tb;
    }
    case "status": {
      const rank: Record<string, number> = {
        submitted: 0,
        rejected: 1,
        approved: 2,
        none: 3,
        draft: 3,
      };
      const ra = rank[a.kybStatus ?? "none"] ?? 4;
      const rb = rank[b.kybStatus ?? "none"] ?? 4;
      return ra - rb;
    }
  }
}

function SortableHead({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === column;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label}
        <Icon className="h-3 w-3 opacity-60" />
      </button>
    </TableHead>
  );
}

function IssuerTableRow({
  org,
  onReview,
}: {
  org: AppOrg;
  onReview: () => void;
}) {
  const badge = STATUS_BADGE[org.kybStatus ?? "none"];
  const submitted = org.kybApplication?.submittedAt
    ? new Date(org.kybApplication.submittedAt).toLocaleString()
    : "—";
  const ctaLabel = org.kybStatus === "submitted" ? "Review" : "View";
  return (
    <TableRow className="cursor-pointer" onClick={onReview}>
      <TableCell className="font-medium">{org.name}</TableCell>
      <TableCell className="text-muted-foreground">
        {org.kybApplication?.legalEntityName ?? "—"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {org.kybApplication?.jurisdiction ?? "—"}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">{submitted}</TableCell>
      <TableCell>
        {badge ? (
          <Badge variant="outline" className={`text-xs ${badge.cls}`}>
            {badge.label}
          </Badge>
        ) : null}
      </TableCell>
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <Button variant="outline" size="sm" onClick={onReview}>
          {ctaLabel}
        </Button>
      </TableCell>
    </TableRow>
  );
}

function ReviewSheet({
  org,
  onOpenChange,
  onSettled,
}: {
  org: AppOrg | null;
  onOpenChange: (open: boolean) => void;
  onSettled: () => Promise<void>;
}) {
  const open = org !== null;
  const isSubmitted = org?.kybStatus === "submitted";
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        {org ? (
          <ReviewBody org={org} canDecide={isSubmitted} onSettled={onSettled} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function ReviewBody({
  org,
  canDecide,
  onSettled,
}: {
  org: AppOrg;
  canDecide: boolean;
  onSettled: () => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AuditRow[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const review = org.kybReview;
  const application = org.kybApplication;

  useEffect(() => {
    let cancelled = false;
    const ctl = new AbortController();
    setHistory(null);
    setHistoryError(null);
    fetch(`/api/ops/issuers/${encodeURIComponent(org.id)}/history`, {
      cache: "no-store",
      signal: ctl.signal,
    })
      .then(async (r) => {
        const data = (await r.json().catch(() => ({}))) as {
          entries?: AuditRow[];
          error?: string;
        };
        if (cancelled) return;
        if (!r.ok) {
          setHistoryError(
            typeof data.error === "string"
              ? data.error
              : "Could not load history.",
          );
          return;
        }
        setHistory(data.entries ?? []);
      })
      .catch(() => {
        if (!cancelled) setHistoryError("Could not load history.");
      });
    return () => {
      cancelled = true;
      ctl.abort();
    };
  }, [org.id]);

  async function decide(decision: "approved" | "rejected") {
    if (decision === "rejected" && reason.trim().length === 0) {
      setError("A reason is required to reject an application.");
      return;
    }
    setBusy(decision === "approved" ? "approve" : "reject");
    setError(null);
    try {
      const r = await fetch(
        `/api/ops/issuers/${encodeURIComponent(org.id)}/kyb/decision`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            decision,
            reason: decision === "rejected" ? reason.trim() : null,
          }),
        },
      );
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Could not save decision.",
        );
        return;
      }
      await onSettled();
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <SheetHeader className="space-y-1">
        <SheetTitle>{org.name}</SheetTitle>
        <SheetDescription>Issuer application review</SheetDescription>
      </SheetHeader>

      <div className="space-y-6 px-1 py-4 text-sm">
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Application
          </h3>
          <dl className="space-y-2 rounded-md border bg-muted/30 p-3">
            <Row label="Legal entity" value={application?.legalEntityName ?? "—"} />
            <Row label="Jurisdiction" value={application?.jurisdiction ?? "—"} />
            <Row
              label="Website"
              value={
                application?.companyWebsite ? (
                  <a
                    href={application.companyWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2"
                  >
                    {application.companyWebsite}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Row label="Notes" value={application?.notes ?? "—"} />
            <Row
              label="Submitted"
              value={
                application?.submittedAt
                  ? new Date(application.submittedAt).toLocaleString()
                  : "—"
              }
            />
          </dl>
        </section>

        {review ? (
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Last decision
            </h3>
            <dl className="space-y-2 rounded-md border bg-muted/30 p-3">
              <Row label="Outcome" value={review.decision} />
              <Row label="Reviewer" value={review.decidedByUserId} />
              <Row label="At" value={new Date(review.decidedAt).toLocaleString()} />
              {review.reason ? <Row label="Reason" value={review.reason} /> : null}
            </dl>
          </section>
        ) : null}

        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            History
          </h3>
          {historyError ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {historyError}
            </p>
          ) : history === null ? (
            <p className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Loading…
            </p>
          ) : history.length === 0 ? (
            <p className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              No history yet.
            </p>
          ) : (
            <ol className="space-y-2 rounded-md border bg-muted/30 p-3">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="grid grid-cols-[8rem_1fr] items-start gap-2 text-xs"
                >
                  <span className="text-muted-foreground">
                    {new Date(h.ts).toLocaleString()}
                  </span>
                  <span>
                    <span className="font-medium">{labelForAction(h.action)}</span>
                    {h.actorUserId && h.actorUserId !== "system" ? (
                      <span className="text-muted-foreground"> by {h.actorUserId}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {canDecide ? (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Decision
            </h3>
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection reason (required to reject)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain what needs to change before the issuer can resubmit."
                rows={4}
              />
            </div>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <div className="flex gap-2">
              <Button
                onClick={() => decide("approved")}
                disabled={busy !== null}
                className="flex-1"
              >
                {busy === "approve" ? "Approving…" : "Approve"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => decide("rejected")}
                disabled={busy !== null}
                className="flex-1"
              >
                {busy === "reject" ? "Rejecting…" : "Reject"}
              </Button>
            </div>
          </section>
        ) : (
          <p className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            This application is not currently awaiting review. Status:{" "}
            {STATUS_BADGE[org.kybStatus ?? "none"]?.label ?? org.kybStatus}.
          </p>
        )}
      </div>
    </>
  );
}

function labelForAction(action: string): string {
  switch (action) {
    case "kyb.submitted":
      return "Application submitted";
    case "kyb.approved":
      return "Application approved";
    case "kyb.rejected":
      return "Application rejected";
    case "ops.action":
      return "Identity event";
    default:
      return action;
  }
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-start gap-2">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}
