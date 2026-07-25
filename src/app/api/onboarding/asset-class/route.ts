// ============================================================
// POST /api/onboarding/asset-class — Set the issuer org's asset-class entitlement.
//
// The explicit replacement for the old silent real-estate default: a new issuer
// picks one asset class in onboarding, and that single choice is written to the
// org's product entitlement. Only an ENABLED product may be selected.
// ============================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { organizationAdapter } from "@/lib/container.server";
import { errorResponse } from "@/lib/auth/api";
import { requireOrg } from "@/lib/auth/server";
import { getProduct, parseProductKeys } from "@/lib/products";

/** Cookie set on /sign-up?product=… — pre-selects the picker, cleared once chosen. */
const PRODUCT_INTENT_COOKIE = "qb_product";

const BodySchema = z.object({ product: z.string().trim().min(1) });

export async function POST(req: Request) {
  try {
    const session = await requireOrg("issuer");
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    // Validate: a known product key AND one that is currently enabled.
    const [key] = parseProductKeys([parsed.data.product]);
    if (!key || !getProduct(key).enabled) {
      return NextResponse.json({ error: "Unknown or disabled asset class" }, { status: 400 });
    }
    if (!session.activeOrg) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 });
    }

    await organizationAdapter.updateOrgMetadata(session.activeOrg.id, { products: [key] });

    const res = NextResponse.json({ ok: true, product: key });
    res.cookies.set(PRODUCT_INTENT_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}
