import { NextResponse } from "next/server";

/**
 * POST /api/team/invite
 * Body: { email: string, role: string }
 *
 * TODO: Integrate your auth provider (Auth0, Clerk, Cognito, etc.) to send
 * the invite email and persist the pending membership.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; platformRole?: string; role?: string };
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const platformRoleRaw =
      typeof body.platformRole === "string" ? body.platformRole.trim().toLowerCase() : "";
    const legacyRole = typeof body.role === "string" ? body.role.trim() : "";
    const platformRole =
      platformRoleRaw === "admin" || platformRoleRaw === "member"
        ? platformRoleRaw
        : legacyRole === "admin" || legacyRole === "member"
          ? legacyRole
          : "";

    if (!email || !platformRole) {
      return NextResponse.json(
        { error: "email and platformRole (admin | member) are required" },
        { status: 400 },
      );
    }

    // TODO: authProvider.inviteMember({ email, platformRole })
    const id = `invite-${crypto.randomUUID()}`;

    return NextResponse.json({
      ok: true,
      id,
      email,
      platformRole,
      message: "Invite recorded (stub — connect auth provider)",
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
