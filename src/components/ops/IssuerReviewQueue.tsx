"use client";

// ============================================================
// components/ops/IssuerReviewQueue.tsx
// Client view of the issuer KYB review queue.
//
// Pattern matches /workspace/settings/team: server component
// renders the page chrome + initial list, this client owns tab
// state, the review drawer, and the approve/reject mutations.
//
// Status is the source of truth for the tab — switching tabs
// refetches; the drawer's success refreshes the active tab.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AppOrg } from "@/lib/core/identity.types";
import type { IssuerKybStatus } from "@/lib/core/issuer-kyb";

type TabKey = "submitted" | "approved" | "rejected" | "all";

const TAB_LABEL: Record<TabKey, string> = {
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  all: "All",
};

const STATUS_BADGE: Partial<Record<IssuerKybStatus, { label: string; cls: string }>> = {
  submitted: { label: "Awaiting review", cls: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200" },
  approved: { label: "Approved", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200" },
  rejected: { label: "Rejected", cls: "border-destructive/40 bg-destructive/10 text-destructive" },
  none: { label: "Not started", cls: "border-muted-foreground/30 bg-muted text-muted-foreground" },
  draft: { label: "Draft", cls: "border-muted-foreground/30 bg-muted text-muted-foreground" },
};

interface Props {
  initialOrgs: AppOrg[];
  initialTab: TabKey;
  /** When a deep-link from a notification lands here, auto-open the
   *  review drawer for this org if it appears in the loaded list. */
  focusOrgId?: string | null;
}

export function IssuerReviewQueue({ initialOrgs, initialTab, focusOrgId }: Props) {
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [orgs, setOrgs] = useState<AppOrg[]>(initialOrgs);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AppOrg | null>(() => {
    if (!focusOrgId) return null;
    return initialOrgs.find((o) => o.id === focusOrgId) ?? null;
  });

  const refresh = useCallback(async (target: TabKey) => {
    setLoading(true);
    setListError(null);
    try {
      const r = await fetch(`/api/ops/issuers?status=${encodeURIComponent(target)}`, {
        cache: "no-store",
      });
      const data = (await r.json().catch(() => ({}))) as { orgs?: AppOrg[]; error?: string };
      if (!r.ok) {
        setListError(typeof data.error === "string" ? data.error : "Could not load issuers.");
        setOrgs([]);
        return;
      }
      setOrgs(data.orgs ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === initialTab) return;
    void refresh(tab);
  }, [tab, initialTab, refresh]);

  const onDecisionSettled = useCallback(async () => {
    setSelected(null);
    await refresh(tab);
  }, [tab, refresh]);

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList>
          {(Object.keys(TAB_LABEL) as TabKey[]).map((k) => (
            <TabsTrigger key={k} value={k}>
              {TAB_LABEL[k]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {listError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {listError}
        </div>
      ) : null}

      <div className="rounded-lg border bg-card">
        {loading ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : orgs.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            No issuers match this filter.
          </p>
        ) : (
          <ul className="divide-y">
            {orgs.map((o) => (
              <IssuerRow key={o.id} org={o} onReview={() => setSelected(o)} />
            ))}
          </ul>
        )}
      </div>

      <ReviewSheet
        org={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onSettled={onDecisionSettled}
      />
    </div>
  );
}

function IssuerRow({ org, onReview }: { org: AppOrg; onReview: () => void }) {
  const badge = STATUS_BADGE[org.kybStatus ?? "none"];
  const submitted = org.kybApplication?.submittedAt
    ? new Date(org.kybApplication.submittedAt).toLocaleString()
    : "—";
  return (
    <li className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="font-medium">{org.name}</span>
          {badge ? (
            <Badge variant="outline" className={`text-xs ${badge.cls}`}>
              {badge.label}
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {org.kybApplication?.legalEntityName ?? "—"}
          {org.kybApplication?.jurisdiction ? ` · ${org.kybApplication.jurisdiction}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">Submitted: {submitted}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onReview}>
          Review
        </Button>
      </div>
    </li>
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
      <SheetContent className="w-full sm:max-w-lg">
        {org ? <ReviewBody org={org} canDecide={isSubmitted} onSettled={onSettled} /> : null}
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
  const review = org.kybReview;
  const application = org.kybApplication;

  const reasonRequired = useMemo(() => reason.trim().length === 0, [reason]);

  async function decide(decision: "approved" | "rejected") {
    if (decision === "rejected" && reasonRequired) {
      setError("A reason is required to reject a KYB application.");
      return;
    }
    setBusy(decision === "approved" ? "approve" : "reject");
    setError(null);
    try {
      const r = await fetch(`/api/ops/issuers/${encodeURIComponent(org.id)}/kyb/decision`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          decision,
          reason: decision === "rejected" ? reason.trim() : null,
        }),
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save decision.");
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
        <SheetDescription>Issuer KYB review</SheetDescription>
      </SheetHeader>

      <div className="space-y-6 px-1 py-4 text-sm">
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Submission
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
            This issuer is not currently awaiting review. Status: {org.kybStatus ?? "none"}.
          </p>
        )}
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-start gap-2">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}
