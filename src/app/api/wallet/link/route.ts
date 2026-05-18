// ============================================================
// POST   /api/wallet/link    → verify signature & bind wallet
// Body: { address: 0x..., signature: 0x..., nonce: string }
//
// DELETE /api/wallet/link    → unbind wallet from current user
// ============================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { auditLogAdapter, walletLinkAdapter } from "@/lib/container.server";
import { assertIssuerOrgKybApproved, requireSession } from "@/lib/auth/server";
import { errorResponse } from "@/lib/auth/api";

const LinkSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
  nonce: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const active = session.activeOrg;
    if (active?.kind === "issuer") {
      assertIssuerOrgKybApproved(active);
    }
    const body = await request.json();
    const parsed = LinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    await walletLinkAdapter.verifyAndLink({
      userId: session.user.id,
      address: parsed.data.address as `0x${string}`,
      signature: parsed.data.signature as `0x${string}`,
      nonce: parsed.data.nonce,
    });
    await auditLogAdapter.append({
      orgId: session.activeOrg?.id ?? null,
      actorUserId: session.user.id,
      action: "wallet.linked",
      target: parsed.data.address,
      payload: {},
    });
    return NextResponse.json({ ok: true, address: parsed.data.address });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE() {
  try {
    const session = await requireSession();
    const active = session.activeOrg;
    if (active?.kind === "issuer") {
      assertIssuerOrgKybApproved(active);
    }
    await walletLinkAdapter.unlink(session.user.id);
    await auditLogAdapter.append({
      orgId: session.activeOrg?.id ?? null,
      actorUserId: session.user.id,
      action: "wallet.unlinked",
      target: session.user.id,
      payload: {},
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
