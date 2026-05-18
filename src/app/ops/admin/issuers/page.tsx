// ============================================================
// app/ops/admin/issuers/page.tsx
// Ops review queue. Server-side prefetch of the "submitted" tab so
// reviewers see work immediately; tabs/actions are client-side.
// ============================================================

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { can } from "@/lib/auth/permissions";
import { organizationAdapter } from "@/lib/container.server";
import { IssuerReviewQueue } from "@/components/ops/IssuerReviewQueue";
import type { AppOrg } from "@/lib/core/identity.types";
import type { IssuerKybStatus } from "@/lib/core/issuer-kyb";

type TabKey = "submitted" | "approved" | "rejected" | "all";

function tabForStatus(s: IssuerKybStatus | null): TabKey {
  if (s === "approved" || s === "rejected" || s === "submitted") return s;
  return "submitted";
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
  searchParams: Promise<{ focus?: string | string[] }>;
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
  const focusRaw = params.focus;
  const focusOrgId = Array.isArray(focusRaw) ? focusRaw[0] : focusRaw;

  const all = await organizationAdapter.listOrgs({ kind: "issuer", limit: 500 });
  const focused = focusOrgId
    ? all.find((o) => o.id === focusOrgId) ?? null
    : null;

  // If the link points at an org that was already moved out of the
  // "submitted" tab (e.g. a teammate acted first), land on whichever
  // tab still contains it so the reviewer sees it without hunting.
  const initialTab: TabKey = focused
    ? tabForStatus(focused.kybStatus)
    : "submitted";

  const initialOrgs = sortByRecency(
    initialTab === "submitted"
      ? all.filter((o) => o.kybStatus === "submitted")
      : all.filter((o) => o.kybStatus === initialTab),
  );

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Issuer review</h1>
        <p className="text-sm text-muted-foreground">
          Approve or reject pending issuer KYB submissions. Approvals unlock the issuer workspace.
        </p>
      </header>
      <IssuerReviewQueue
        initialOrgs={initialOrgs}
        initialTab={initialTab}
        focusOrgId={focused?.id ?? null}
      />
    </div>
  );
}
