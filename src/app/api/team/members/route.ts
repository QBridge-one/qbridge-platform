// ============================================================
// GET /api/team/members  → list members in active org
// ============================================================

import { NextResponse } from "next/server";
import { organizationAdapter } from "@/lib/container.server";
import { assertIssuerOrgKybApproved, requireOrg, requirePermission } from "@/lib/auth/server";
import { errorResponse } from "@/lib/auth/api";
import type { Permission } from "@/lib/auth/permissions";

const PERM: Record<"ops" | "issuer", Permission> = {
  ops: "ops:team:view",
  issuer: "workspace:team:view",
};

export async function GET() {
  try {
    const base = await requireOrg();
    const session = await requirePermission(PERM[base.activeOrg.kind]);
    assertIssuerOrgKybApproved(session.activeOrg);
    const members = await organizationAdapter.listMembers(session.activeOrg.id);
    return NextResponse.json({ ok: true, members });
  } catch (err) {
    return errorResponse(err);
  }
}
