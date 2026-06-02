// ============================================================
// POST /api/ops/issuers/[orgId]/registry/confirm
//
// Called by the ops UI after the on-chain verifyIssuer/registerIssuer
// tx confirms. Records the chainRegistration snapshot on the org's
// Clerk publicMetadata, writes an audit row, and fires the final
// "workspace active" notification to the issuer admins.
//
// The contract is the source of truth for on-chain status; this
// endpoint just caches the result so the issuer's stepper can flip
// fully green without hitting RPC on every page load.
//
// Auth: requirePermission("ops:issuers:approve").
// Body: { txHash: "0x…", chainId: number }
// ============================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  auditLogAdapter,
  emailAdapter,
  notificationAdapter,
  organizationAdapter,
} from "@/lib/container.server";
import { requirePermission } from "@/lib/auth/server";
import { errorResponse } from "@/lib/auth/api";
import { forbidden, orgNotFound } from "@/lib/core/errors";
import { dispatchNotification } from "@/lib/services/notification.service";

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
      throw forbidden("Only issuer workspaces can be registered on-chain.");
    }

    const registeredAt = new Date().toISOString();
    await organizationAdapter.updateOrgMetadata(org.id, {
      chainRegistration: {
        status: "registered",
        txHash,
        chainId,
        registeredAt,
        registeredBy: session.user.id,
      },
    });

    await auditLogAdapter.append({
      orgId: org.id,
      actorUserId: session.user.id,
      action: "kyb.chain_verified",
      target: txHash,
      payload: { chainId, registeredAt },
    });

    await dispatchNotification(
      {
        notification: notificationAdapter,
        organization: organizationAdapter,
        email: emailAdapter,
      },
      {
        kind: "issuer.workspace_active",
        orgId: org.id,
        payload: {
          issuerOrgId: org.id,
          issuerOrgName: org.name ?? org.slug ?? org.id,
          registeredByUserId: session.user.id,
          registeredAt,
          txHash,
          chainId,
        },
        recipients: [{ orgId: org.id, plane: "issuer", roles: ["issuer_admin"] }],
        // Idempotent if the client retries the confirm call.
        dedupeKey: `${org.id}:workspace_active:${txHash}`,
      },
    );

    return NextResponse.json({ ok: true, registeredAt });
  } catch (err) {
    return errorResponse(err);
  }
}
