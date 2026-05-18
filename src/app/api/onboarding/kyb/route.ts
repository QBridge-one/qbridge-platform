// ============================================================
// POST /api/onboarding/kyb — Persist issuer KYB application (pending review).
// ============================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  auditLogAdapter,
  emailAdapter,
  notificationAdapter,
  OPS_ORG_ID,
  organizationAdapter,
} from "@/lib/container.server";
import { errorResponse } from "@/lib/auth/api";
import { requireOrg } from "@/lib/auth/server";
import { submitIssuerKybApplication } from "@/lib/services/onboarding.service";

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
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    await submitIssuerKybApplication(
      {
        organization: organizationAdapter,
        audit: auditLogAdapter,
        notification: notificationAdapter,
        email: emailAdapter,
      },
      {
        session,
        body: {
          legalEntityName: parsed.data.legalEntityName,
          jurisdiction: parsed.data.jurisdiction,
          companyWebsite: parsed.data.companyWebsite ?? null,
          notes: parsed.data.notes ?? null,
        },
        opsOrgId: OPS_ORG_ID,
      },
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
