// ============================================================
// POST /api/ops/issuers/[orgId]/kyb/decision
//
// Ops-side action that approves or rejects a submitted issuer KYB
// application. Owns the trigger so audit + notification + state
// flip happen together (rather than relying on someone toggling
// kybStatus in the Clerk dashboard).
//
// Authorization:
//   - Active org must be the ops workspace (requireOrg("ops")).
//   - Actor must hold "ops:issuers:kyb_review" — ops_admin or
//     ops_onboarding by default (see lib/auth/permissions.ts).
//
// Body:
//   { decision: "approved" | "rejected", reason?: string }
//   Reason is REQUIRED when decision === "rejected".
// ============================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  auditLogAdapter,
  emailAdapter,
  notificationAdapter,
  organizationAdapter,
} from "@/lib/container.server";
import { errorResponse } from "@/lib/auth/api";
import { requirePermission } from "@/lib/auth/server";
import { decideIssuerKyb } from "@/lib/services/onboarding.service";

const BodySchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  reason: z
    .union([z.string().max(2000), z.literal(""), z.null()])
    .optional()
    .transform((v) => {
      if (v == null || v === "") return null;
      const t = v.trim();
      return t === "" ? null : t;
    }),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ orgId: string }> },
) {
  try {
    const session = await requirePermission("ops:issuers:kyb_review");
    const { orgId } = await ctx.params;
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    await decideIssuerKyb(
      {
        organization: organizationAdapter,
        audit: auditLogAdapter,
        notification: notificationAdapter,
        email: emailAdapter,
      },
      {
        actorSession: session,
        targetIssuerOrgId: orgId,
        decision: parsed.data.decision,
        reason: parsed.data.reason,
      },
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
