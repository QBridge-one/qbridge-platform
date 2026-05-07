// ============================================================
// lib/ports/auth-webhook.port.ts
// Verifies + normalizes IdP webhooks (Clerk svix, WorkOS, Auth0…).
// Output is a vendor-agnostic AuthEvent the app can mirror to DB.
// ============================================================

import type { AuthEvent } from "../core/identity.types";

export interface AuthWebhookPort {
  /**
   * Verify the request signature against the IdP's webhook secret and
   * normalize the body into an AuthEvent. Throws DomainError
   * "WEBHOOK_SIGNATURE_INVALID" on bad signature.
   */
  verify(request: Request): Promise<AuthEvent>;
}
