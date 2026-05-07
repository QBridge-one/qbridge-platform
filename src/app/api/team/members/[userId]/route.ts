// ============================================================
// PATCH  /api/team/members/[userId]  → update app role (issuer/ops)
// DELETE /api/team/members/[userId]  → remove member from active org
// ============================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { auditLogAdapter, organizationAdapter } from "@/lib/container.server";
import { requireOrg, requirePermission } from "@/lib/auth/server";
import { errorResponse } from "@/lib/auth/api";
import { APP_ROLES, type AppRole } from "@/lib/core/identity.types";
import type { Permission } from "@/lib/auth/permissions";

const APP_ROLE_ENUM = z.enum(APP_ROLES as [AppRole, ...AppRole[]]);

const RoleSchema = z.object({
  appRole: APP_ROLE_ENUM,
});

const CHANGE: Record<"ops" | "issuer", Permission> = {
  ops: "ops:team:change_role",
  issuer: "workspace:team:change_role",
};

const REMOVE: Record<"ops" | "issuer", Permission> = {
  ops: "ops:team:remove",
  issuer: "workspace:team:remove",
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await context.params;
    const base = await requireOrg();
    const session = await requirePermission(CHANGE[base.activeOrg.kind]);
    const body = await request.json();
    const parsed = RoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const updated = await organizationAdapter.updateMemberRole(
      session.activeOrg.id,
      userId,
      parsed.data.appRole,
    );
    await auditLogAdapter.append({
      orgId: session.activeOrg.id,
      actorUserId: session.user.id,
      action: "member.role_changed",
      target: userId,
      payload: { appRole: parsed.data.appRole },
    });
    return NextResponse.json({ ok: true, member: updated });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await context.params;
    const base = await requireOrg();
    const session = await requirePermission(REMOVE[base.activeOrg.kind]);
    await organizationAdapter.removeMember(session.activeOrg.id, userId);
    await auditLogAdapter.append({
      orgId: session.activeOrg.id,
      actorUserId: session.user.id,
      action: "member.removed",
      target: userId,
      payload: {},
    });
    return NextResponse.json({ ok: true, userId });
  } catch (err) {
    return errorResponse(err);
  }
}
