// ============================================================
// DELETE /api/team/invite/[id]  → revoke a pending invite
// ============================================================

import { NextResponse } from "next/server";
import { auditLogAdapter, organizationAdapter } from "@/lib/container.server";
import { assertIssuerOrgKybApproved, requireOrg, requirePermission } from "@/lib/auth/server";
import { errorResponse } from "@/lib/auth/api";
import type { Permission } from "@/lib/auth/permissions";

const PERM: Record<"ops" | "issuer", Permission> = {
  ops: "ops:team:invite",
  issuer: "workspace:team:invite",
};

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing invite id" }, { status: 400 });
    }
    const base = await requireOrg();
    const session = await requirePermission(PERM[base.activeOrg.kind]);
    assertIssuerOrgKybApproved(session.activeOrg);
    await organizationAdapter.revokeInvite(session.activeOrg.id, id);
    await auditLogAdapter.append({
      orgId: session.activeOrg.id,
      actorUserId: session.user.id,
      action: "invite.revoked",
      target: id,
      payload: {},
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return errorResponse(err);
  }
}
