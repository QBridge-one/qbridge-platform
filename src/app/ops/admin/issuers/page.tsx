// ============================================================
// app/ops/admin/issuers/page.tsx
// Ops issuer-application queue.
//
// URL is the source of truth for tab + focused row:
//   ?status=submitted|approved|rejected|all   (default "all")
//   ?focus=<orgId>                            (opens the review drawer)
//
// Server reads both, prefetches the visible list, and — if focus is
// set — fetches the focused org separately so the drawer can open
// even when its status doesn't match the active tab.
// ============================================================

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { can } from "@/lib/auth/permissions";
import { organizationAdapter } from "@/lib/container.server";
import { IssuerReviewQueue } from "@/components/ops/IssuerReviewQueue";
import type { AppOrg } from "@/lib/core/identity.types";

type TabKey = "submitted" | "approved" | "rejected" | "all";

const ALLOWED_TABS: ReadonlySet<TabKey> = new Set<TabKey>([
  "submitted",
  "approved",
  "rejected",
  "all",
]);

function isTabKey(v: unknown): v is TabKey {
  return typeof v === "string" && (ALLOWED_TABS as ReadonlySet<string>).has(v);
}

function sortByRecency(orgs: AppOrg[]): AppOrg[] {
  return orgs.slice().sort((a, b) => {
    const ta = a.kybApplication?.submittedAt
      ? Date.parse(a.kybApplication.submittedAt)
      : Date.parse(a.createdAt);
    const tb = b.kybApplication?.submittedAt
      ? Date.parse(b.kybApplication.submittedAt)
      : Date.parse(b.createdAt);
    return tb - ta;
  });
}

export default async function OpsIssuerReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[]; focus?: string | string[] }>;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!session.activeOrg || session.activeOrg.kind !== "ops") {
    redirect("/select-workspace");
  }
  if (!can(session.appRoles, "ops:issuers:kyb_review")) {
    redirect("/ops");
  }

  const params = await searchParams;
  const statusRaw = Array.isArray(params.status) ? params.status[0] : params.status;
  const focusRaw = Array.isArray(params.focus) ? params.focus[0] : params.focus;
  const tab: TabKey = isTabKey(statusRaw) ? statusRaw : "all";
  const focusOrgId = focusRaw && focusRaw.length > 0 ? focusRaw : null;

  const all = await organizationAdapter.listOrgs({ kind: "issuer", limit: 500 });
  const initialOrgs = sortByRecency(
    tab === "all" ? all : all.filter((o) => o.kybStatus === tab),
  );
  // Focused org is fetched separately so the drawer can open even when
  // the user is on a tab that doesn't contain it. Falls back to null
  // (drawer stays closed) when the id doesn't match anything.
  const focusedOrg = focusOrgId
    ? (all.find((o) => o.id === focusOrgId) ?? null)
    : null;

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Issuer applications</h1>
        <p className="text-sm text-muted-foreground">
          Review issuer applications and track both off-chain application status and on-chain
          IssuerRegistry registration.
        </p>
      </header>
      <IssuerReviewQueue
        initialOrgs={initialOrgs}
        initialTab={tab}
        focusedOrg={focusedOrg}
      />
    </div>
  );
}
