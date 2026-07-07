// ============================================================
// POST /api/onboarding/kyb — Persist issuer KYB application (pending review).
// ============================================================

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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
import { parseProductKeys } from "@/lib/products";

/** Cookie set on /sign-up?product=… so the issuer's entry product seeds their org. */
const PRODUCT_INTENT_COOKIE = "qb_product";

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
    // Seed the issuer's product entitlement from their marketing entry point
    // (the /sign-up?product=… cookie). Best-effort — never fail the KYB submit
    // over it. Ops can adjust the entitlement later.
    const res = NextResponse.json({ ok: true });
    try {
      const cookieStore = await cookies();
      const intent = parseProductKeys([cookieStore.get(PRODUCT_INTENT_COOKIE)?.value]);
      if (intent.length > 0 && session.activeOrg) {
        await organizationAdapter.updateOrgMetadata(session.activeOrg.id, { products: intent });
      }
      res.cookies.set(PRODUCT_INTENT_COOKIE, "", { maxAge: 0, path: "/" });
    } catch {
      /* entitlement seeding is best-effort */
    }
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}
