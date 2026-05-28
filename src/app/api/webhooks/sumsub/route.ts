// ============================================================
// POST /api/webhooks/sumsub
//
// Receives Sumsub applicant review events, verifies the
// x-payload-digest HMAC over the raw body, normalizes to a
// KybVerificationEvent, and hands off to the shared KYB webhook
// service (update kybCase + notify).
//
// Public endpoint — auth is the x-payload-digest HMAC.
// ============================================================

import { NextResponse } from "next/server";
import { kybProviderByName } from "@/lib/container.server";
import { processKybEvent } from "@/lib/services/kyb-webhook.service";
import { errorResponse } from "@/lib/auth/api";

export async function POST(request: Request) {
  try {
    const sumsub = kybProviderByName("sumsub");
    if (!sumsub) {
      return NextResponse.json({ error: "Sumsub not configured" }, { status: 503 });
    }
    const event = await sumsub.handleWebhook(request);
    const result = await processKybEvent(event, "sumsub");
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
