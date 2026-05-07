// ============================================================
// Legacy: DELETE /api/team/[id]
// Kept for backward compatibility with TeamAccessPage which still
// calls /api/team/${memberId}. Routes through OrganizationPort.
//
// Prefer /api/team/members/[userId] for new code.
// ============================================================

import { NextResponse } from "next/server";
import { auditLogAdapter, organizationAdapter } from "@/lib/container.server";
import { requireOrg, requirePermission } from "@/lib/auth/server";
import { errorResponse } from "@/lib/auth/api";
import type { Permission } from "@/lib/auth/permissions";

const PERM: Record<"ops" | "issuer", Permission> = {
  ops: "ops:team:remove",
  issuer: "workspace:team:remove",
};

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing member id" }, { status: 400 });
    }
    const base = await requireOrg();
    const session = await requirePermission(PERM[base.activeOrg.kind]);
    await organizationAdapter.removeMember(session.activeOrg.id, id);
    await auditLogAdapter.append({
      orgId: session.activeOrg.id,
      actorUserId: session.user.id,
      action: "member.removed",
      target: id,
      payload: { via: "legacy:/api/team/[id]" },
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return errorResponse(err);
  }
}
