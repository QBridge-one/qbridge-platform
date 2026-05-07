// ============================================================
// POST /api/webhooks/identity
//
// Verifies the IdP webhook signature via authWebhookPort, then
// mirrors the event into our app store via identity-mirror service.
//
// Public endpoint — never call requireSession() here.
// ============================================================

import { NextResponse } from "next/server";
import { authWebhookAdapter } from "@/lib/container.server";
import { applyAuthEvent } from "@/lib/services/identity-mirror.service";
import { errorResponse } from "@/lib/auth/api";

export async function POST(request: Request) {
  try {
    const evt = await authWebhookAdapter.verify(request);
    await applyAuthEvent(evt);
    return NextResponse.json({ ok: true, eventId: evt.eventId });
  } catch (err) {
    return errorResponse(err);
  }
}
