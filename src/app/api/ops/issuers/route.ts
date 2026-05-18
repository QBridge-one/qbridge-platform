// ============================================================
// GET /api/ops/issuers — list issuer organizations for the ops queue.
//
// Query: ?status=submitted|approved|rejected|none|all  (default: submitted)
//
// Authorization: requirePermission("ops:issuers:kyb_review").
// Returns the AppOrg shape so the UI can show jurisdiction +
// submittedAt without a follow-up fetch.
// ============================================================

import { NextResponse } from "next/server";
import { organizationAdapter } from "@/lib/container.server";
import { requirePermission } from "@/lib/auth/server";
import { errorResponse } from "@/lib/auth/api";
import type { IssuerKybStatus } from "@/lib/core/issuer-kyb";

const ALLOWED_STATUSES: readonly IssuerKybStatus[] = [
  "none",
  "draft",
  "submitted",
  "approved",
  "rejected",
];

export async function GET(req: Request) {
  try {
    await requirePermission("ops:issuers:kyb_review");
    const url = new URL(req.url);
    const statusParam = (url.searchParams.get("status") ?? "submitted").toLowerCase();
    const orgs = await organizationAdapter.listOrgs({ kind: "issuer", limit: 500 });
    const filtered =
      statusParam === "all"
        ? orgs
        : (ALLOWED_STATUSES as readonly string[]).includes(statusParam)
          ? orgs.filter((o) => o.kybStatus === statusParam)
          : orgs.filter((o) => o.kybStatus === "submitted");
    // Newest first by submission/creation time so the queue surfaces
    // the freshest work to do.
    const sorted = filtered.slice().sort((a, b) => {
      const ta = a.kybApplication?.submittedAt
        ? Date.parse(a.kybApplication.submittedAt)
        : Date.parse(a.createdAt);
      const tb = b.kybApplication?.submittedAt
        ? Date.parse(b.kybApplication.submittedAt)
        : Date.parse(b.createdAt);
      return tb - ta;
    });
    return NextResponse.json({ orgs: sorted });
  } catch (err) {
    return errorResponse(err);
  }
}
