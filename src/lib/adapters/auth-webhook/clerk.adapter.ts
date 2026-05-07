// ============================================================
// lib/adapters/auth-webhook/clerk.adapter.ts
// Clerk webhook verifier (svix) → AuthEvent.
// Activated when IDENTITY_PROVIDER=clerk.
// Requires CLERK_WEBHOOK_SECRET (from Clerk Dashboard → Webhooks).
// ============================================================

import "server-only";

import { Webhook } from "svix";
import type { AuthWebhookPort } from "../../ports/auth-webhook.port";
import type { AuthEvent, AuthEventType } from "../../core/identity.types";
import { webhookSignatureInvalid } from "../../core/errors";

const CLERK_TO_APP_EVENT: Record<string, AuthEventType> = {
  "user.created": "user.created",
  "user.updated": "user.updated",
  "user.deleted": "user.deleted",
  "organization.created": "org.created",
  "organization.updated": "org.updated",
  "organization.deleted": "org.deleted",
  "organizationMembership.created": "membership.created",
  "organizationMembership.updated": "membership.updated",
  "organizationMembership.deleted": "membership.deleted",
  "organizationInvitation.created": "invite.created",
  "organizationInvitation.accepted": "invite.accepted",
  "organizationInvitation.revoked": "invite.revoked",
};

interface SvixVerifiedPayload {
  type?: string;
  data?: unknown;
  id?: string;
}

class ClerkAuthWebhookAdapter implements AuthWebhookPort {
  async verify(request: Request): Promise<AuthEvent> {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) throw webhookSignatureInvalid();

    const payload = await request.text();
    const headers = {
      "svix-id": request.headers.get("svix-id") ?? "",
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    };
    if (!headers["svix-id"] || !headers["svix-timestamp"] || !headers["svix-signature"]) {
      throw webhookSignatureInvalid();
    }

    let evt: SvixVerifiedPayload;
    try {
      evt = new Webhook(secret).verify(payload, headers) as SvixVerifiedPayload;
    } catch {
      throw webhookSignatureInvalid();
    }

    if (!evt.type) throw webhookSignatureInvalid();
    const mapped = CLERK_TO_APP_EVENT[evt.type];
    if (!mapped) {
      // Unknown but well-signed event — record as a generic ops.action so we
      // don't crash the webhook pipeline. Caller can decide what to do.
      return {
        type: "user.updated",
        payload: evt.data ?? {},
        eventId: evt.id ?? `clerk_${headers["svix-id"]}`,
        timestamp: Date.now(),
      };
    }

    return {
      type: mapped,
      payload: evt.data ?? {},
      eventId: evt.id ?? headers["svix-id"],
      timestamp: Date.now(),
    };
  }
}

export const clerkAuthWebhookAdapter = new ClerkAuthWebhookAdapter();
