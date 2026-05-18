// ============================================================
// GET /api/ops/issuers/[orgId]/history
//
// Returns the audit_entries for a single issuer org, scoped to
// application/KYB-related actions. Powers the "History" pane in
// the review drawer.
//
// Authorization: requirePermission("ops:issuers:kyb_review").
// ============================================================

import { NextResponse } from "next/server";
import { auditLogAdapter } from "@/lib/container.server";
import { requirePermission } from "@/lib/auth/server";
import { errorResponse } from "@/lib/auth/api";
import type { AuditAction } from "@/lib/core/identity.types";

/** Actions surfaced in the org history pane — everything that's
 *  meaningful for a reviewer to see at a glance. */
const RELEVANT_ACTIONS: ReadonlySet<AuditAction> = new Set<AuditAction>([
  "kyb.submitted",
  "kyb.approved",
  "kyb.rejected",
]);

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ orgId: string }> },
) {
  try {
    await requirePermission("ops:issuers:kyb_review");
    const { orgId } = await ctx.params;
    const entries = await auditLogAdapter.list({ orgId, limit: 200 });
    const filtered = entries.filter((e) => RELEVANT_ACTIONS.has(e.action));
    return NextResponse.json({ entries: filtered });
  } catch (err) {
    return errorResponse(err);
  }
}
