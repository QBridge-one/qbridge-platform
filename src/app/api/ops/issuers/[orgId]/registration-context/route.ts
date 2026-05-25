// ============================================================
// GET /api/ops/issuers/[orgId]/registration-context
//
// Off-chain inputs for IssuerRegistry.registerIssuer — issuer admin
// wallet, entityId, kybDocumentHash, and the assembled payload when
// registration is ready. Powers the on-chain section in the ops review
// drawer (Phase C).
//
// Authorization: requirePermission("ops:issuers:kyb_review").
// ============================================================

import { NextResponse } from "next/server";
import { organizationAdapter } from "@/lib/container.server";
import { requirePermission } from "@/lib/auth/server";
import { errorResponse } from "@/lib/auth/api";
import { forbidden, orgNotFound } from "@/lib/core/errors";
import { buildIssuerRegistrationContext } from "@/lib/contracts/issuer-registry-payload";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ orgId: string }> },
) {
  try {
    await requirePermission("ops:issuers:kyb_review");
    const { orgId } = await ctx.params;

    const org = await organizationAdapter.getOrg(orgId);
    if (!org) throw orgNotFound(orgId);
    if (org.kind !== "issuer") {
      throw forbidden("Registration context is only available for issuer organizations.");
    }

    const members = await organizationAdapter.listMembers(orgId);
    const context = buildIssuerRegistrationContext({ org, members });

    return NextResponse.json(context);
  } catch (err) {
    return errorResponse(err);
  }
}
