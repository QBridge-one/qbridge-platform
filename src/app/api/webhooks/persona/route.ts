// ============================================================
// POST /api/webhooks/persona
//
// Receives Persona inquiry lifecycle events, verifies the HMAC
// signature, normalizes to a KybVerificationEvent, and hands off
// to the shared KYB webhook service (update kybCase + notify).
//
// Public endpoint — auth is the Persona-Signature HMAC.
// ============================================================

import { NextResponse } from "next/server";
import { kybProviderByName } from "@/lib/container.server";
import { processKybEvent } from "@/lib/services/kyb-webhook.service";
import { errorResponse } from "@/lib/auth/api";

export async function POST(request: Request) {
  try {
    const persona = kybProviderByName("persona");
    if (!persona) {
      return NextResponse.json({ error: "Persona not configured" }, { status: 503 });
    }
    const event = await persona.handleWebhook(request);
    const result = await processKybEvent(event, "persona");
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
