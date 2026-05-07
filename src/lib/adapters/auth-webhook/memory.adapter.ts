// ============================================================
// lib/adapters/auth-webhook/memory.adapter.ts
// Dev-mode webhook adapter — does NOT verify a signature.
// Use only locally; production must use clerkAuthWebhookAdapter.
// ============================================================

import type { AuthWebhookPort } from "../../ports/auth-webhook.port";
import type { AuthEvent } from "../../core/identity.types";
import { webhookSignatureInvalid } from "../../core/errors";

class MemoryAuthWebhookAdapter implements AuthWebhookPort {
  async verify(request: Request): Promise<AuthEvent> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw webhookSignatureInvalid();
    }
    if (!body || typeof body !== "object") throw webhookSignatureInvalid();
    const obj = body as Record<string, unknown>;
    const type = typeof obj.type === "string" ? obj.type : null;
    const eventId = typeof obj.eventId === "string" ? obj.eventId : `mem_${Date.now()}`;
    if (!type) throw webhookSignatureInvalid();
    return {
      type: type as AuthEvent["type"],
      payload: obj.payload ?? {},
      eventId,
      timestamp: Date.now(),
    };
  }
}

export const memoryAuthWebhookAdapter = new MemoryAuthWebhookAdapter();
