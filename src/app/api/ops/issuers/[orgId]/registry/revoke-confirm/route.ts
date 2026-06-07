// ============================================================
// POST /api/ops/issuers/[orgId]/registry/revoke-confirm
//
// Called by the ops UI after the on-chain revokeIssuer tx confirms.
// Revoke is terminal on-chain; this endpoint syncs the off-chain state
// to match policy:
//   1. Caches the "revoked" chainRegistration snapshot.
//   2. Resets kybStatus → "none" so the registration gate re-closes and
//      re-entry requires a FRESH KYB (registerIssuer is gated on
//      kybStatus === "approved").
//   3. Writes an audit row.
//
// Per policy, only on-chain authority + KYB are reset — the issuer keeps
// workspace access and can re-onboard from the KYB step.
//
// The contract is the source of truth for on-chain status; this endpoint
// just keeps the off-chain mirror consistent.
//
// Auth: requirePermission("ops:issuers:approve").
// Body: { txHash: "0x…", chainId: number }
// ============================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { auditLogAdapter, organizationAdapter } from "@/lib/container.server";
import { requirePermission } from "@/lib/auth/server";
import { errorResponse } from "@/lib/auth/api";
import { forbidden, orgNotFound } from "@/lib/core/errors";

const BodySchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "txHash must be a 0x-prefixed 32-byte hex"),
  chainId: z.number().int().positive(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ orgId: string }> },
) {
  try {
    const session = await requirePermission("ops:issuers:approve");
    const { orgId } = await ctx.params;
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { txHash, chainId } = parsed.data;

    const org = await organizationAdapter.getOrg(orgId);
    if (!org) throw orgNotFound(orgId);
    if (org.kind !== "issuer") {
      throw forbidden("Only issuer workspaces can be revoked on-chain.");
    }

    const revokedAt = new Date().toISOString();

    // (1) cache the revoked snapshot + (2) reset KYB so re-entry needs a fresh
    // verification. updateOrgMetadata is a partial merge, so workspace access
    // and other metadata are untouched.
    await organizationAdapter.updateOrgMetadata(org.id, {
      chainRegistration: {
        status: "revoked",
        txHash,
        chainId,
        registeredAt: revokedAt,
        registeredBy: session.user.id,
      },
      kybStatus: "none",
    });

    await auditLogAdapter.append({
      orgId: org.id,
      actorUserId: session.user.id,
      action: "kyb.chain_revoked",
      target: txHash,
      payload: { chainId, revokedAt, kybReset: true },
    });

    return NextResponse.json({ ok: true, revokedAt });
  } catch (err) {
    return errorResponse(err);
  }
}
