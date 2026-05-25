// ============================================================
// POST /api/ops/issuers/registry-status
//
// Batch on-chain IssuerRegistry.isApproved for ops table rows.
// Body: { orgIds: string[] }  (max 500)
//
// Authorization: requirePermission("ops:issuers:kyb_review").
// ============================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/server";
import { errorResponse } from "@/lib/auth/api";
import { organizationAdapter } from "@/lib/container.server";
import { batchIssuerRegistryStatus } from "@/lib/contracts/issuer-registry-status";

const BodySchema = z.object({
  orgIds: z.array(z.string().min(1)).max(500),
});

export async function POST(req: Request) {
  try {
    await requirePermission("ops:issuers:kyb_review");
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const unique = [...new Set(parsed.data.orgIds)];
    const statuses = await batchIssuerRegistryStatus(organizationAdapter, unique);
    return NextResponse.json({ statuses });
  } catch (err) {
    return errorResponse(err);
  }
}
