// ============================================================
// POST /api/onboarding/kyb — Persist issuer KYB application (pending review).
// ============================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrg } from "@/lib/auth/server";
import { errorResponse } from "@/lib/auth/api";
import { organizationAdapter } from "@/lib/container.server";

const BodySchema = z.object({
  legalEntityName: z.string().trim().min(2).max(200),
  jurisdiction: z.string().trim().min(2).max(200),
  companyWebsite: z
    .union([z.string().max(500), z.literal(""), z.null()])
    .optional()
    .transform((v) => {
      if (v == null || v === "") return null;
      const t = v.trim();
      return t === "" ? null : t;
    })
    .refine((v) => v === null || z.string().url().safeParse(v).success, {
      message: "Invalid company website URL",
    }),
  notes: z
    .union([z.string().max(5000), z.literal(""), z.null()])
    .optional()
    .transform((v) => {
      if (v == null || v === "") return null;
      const t = v.trim();
      return t === "" ? null : t;
    }),
});

export async function POST(req: Request) {
  try {
    const session = await requireOrg("issuer");
    const st = session.activeOrg.kybStatus;
    if (st === "approved" || st === "submitted") {
      return NextResponse.json({ error: "KYB submission is already finalized or awaiting review." }, { status: 409 });
    }
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    const orgId = session.activeOrg.id;
    await organizationAdapter.submitIssuerKyb(orgId, {
      legalEntityName: parsed.data.legalEntityName,
      jurisdiction: parsed.data.jurisdiction,
      companyWebsite: parsed.data.companyWebsite ?? null,
      notes: parsed.data.notes ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
