// ============================================================
// POST   /api/team/invite     → invite a member to the active org
// GET    /api/team/invite     → list pending invites (active org)
// ============================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { auditLogAdapter, organizationAdapter } from "@/lib/container.server";
import { assertIssuerOrgKybApproved, requireOrg, requirePermission } from "@/lib/auth/server";
import { errorResponse } from "@/lib/auth/api";
import { APP_ROLES, type AppRole } from "@/lib/core/identity.types";
import type { Permission } from "@/lib/auth/permissions";

// All known AppRole strings — kept as a Zod enum for body validation.
// Note: the team-invite UI only sends admin/member legacy fields today;
// these granular roles are accepted so they can be assigned later via
// the team page (PATCH /api/team/members/[userId]) once that UI lands.
const APP_ROLE_ENUM = z.enum(APP_ROLES as [AppRole, ...AppRole[]]);

const InviteSchema = z.object({
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
  appRole: APP_ROLE_ENUM.optional(),
  appRoles: z.array(APP_ROLE_ENUM).optional(),
  // Legacy fields kept for compatibility with the existing UI
  platformRole: z.enum(["admin", "member"]).optional(),
  role: z.enum(["admin", "member"]).optional(),
});

function resolveAppRole(
  parsed: z.infer<typeof InviteSchema>,
  orgKind: "ops" | "issuer",
): AppRole {
  if (parsed.appRole) return parsed.appRole;
  const legacy = parsed.platformRole ?? parsed.role;
  if (orgKind === "ops") {
    return legacy === "admin" ? "ops_admin" : "ops_member";
  }
  return legacy === "admin" ? "issuer_admin" : "issuer_member";
}

const INVITE_PERM: Record<"ops" | "issuer", Permission> = {
  ops: "ops:team:invite",
  issuer: "workspace:team:invite",
};

const VIEW_PERM: Record<"ops" | "issuer", Permission> = {
  ops: "ops:team:view",
  issuer: "workspace:team:view",
};

/**
 * Build the URL Clerk will redirect the invitee to AFTER they accept
 * the invitation (sign up / sign in). We use the request's own origin
 * so dev (`localhost:3000`), ngrok previews, and prod all work without
 * touching env vars or the Clerk dashboard.
 */
function resolveInviteRedirect(request: Request): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return new URL("/select-workspace", explicit).toString();
  const origin = request.headers.get("origin");
  if (origin) return new URL("/select-workspace", origin).toString();
  // Fallback: derive from the request URL itself.
  const u = new URL(request.url);
  return `${u.protocol}//${u.host}/select-workspace`;
}

export async function POST(request: Request) {
  try {
    const base = await requireOrg();
    const session = await requirePermission(INVITE_PERM[base.activeOrg.kind]);
    assertIssuerOrgKybApproved(session.activeOrg);

    const body = await request.json();
    const parsed = InviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const orgId = session.activeOrg.id;
    const primaryRole = resolveAppRole(parsed.data, session.activeOrg.kind);
    const extraRoles = (parsed.data.appRoles ?? []).filter(
      (r) =>
        r !== primaryRole &&
        // plane-sanity: never let an issuer invite include ops_* roles or vice versa
        (session.activeOrg.kind === "ops"
          ? r.startsWith("ops_")
          : r.startsWith("issuer_")),
    );
    const redirectUrl = resolveInviteRedirect(request);

    const invite = await organizationAdapter.inviteMember(
      orgId,
      session.user.id,
      {
        email: parsed.data.email,
        appRole: primaryRole,
        appRoles: extraRoles.length > 0 ? [primaryRole, ...extraRoles] : undefined,
        redirectUrl,
      },
    );

    await auditLogAdapter.append({
      orgId,
      actorUserId: session.user.id,
      action: "invite.sent",
      target: parsed.data.email,
      payload: { inviteId: invite.id, appRole: primaryRole, appRoles: invite.appRoles },
    });

    return NextResponse.json({
      ok: true,
      id: invite.id,
      email: invite.email,
      appRole: invite.appRole,
      appRoles: invite.appRoles,
      platformRole: primaryRole.endsWith("_admin") ? "admin" : "member",
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function GET() {
  try {
    const base = await requireOrg();
    const session = await requirePermission(VIEW_PERM[base.activeOrg.kind]);
    assertIssuerOrgKybApproved(session.activeOrg);
    const invites = await organizationAdapter.listInvites(session.activeOrg.id);
    return NextResponse.json({ ok: true, invites });
  } catch (err) {
    return errorResponse(err);
  }
}
