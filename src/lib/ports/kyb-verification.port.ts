// ============================================================
// lib/ports/kyb-verification.port.ts
// Provider-agnostic KYB verification lifecycle.
//
// Implemented by:
//   - PersonaKybAdapter   (Persona inquiries, production)
//   - (future) SumsubKybAdapter, ManualKybAdapter
//
// The onboarding service calls `createCase` to start a
// verification; the provider's webhook calls `handleWebhook`
// to report status transitions; the stepper reads case status
// via the org's metadata (set by the service after each event).
// ============================================================

import type {
  CreateCaseInput,
  CreateCaseResult,
  KybCaseStatus,
  KybVerificationEvent,
} from "../core/kyb-verification";

export interface KybVerificationPort {
  /** Create a new verification case (or resume an existing one). */
  createCase(input: CreateCaseInput): Promise<CreateCaseResult>;

  /** Poll the provider for a case's current status. Used for
   *  reconciliation / ops tooling — the primary path is webhooks. */
  getCaseStatus(caseId: string): Promise<KybCaseStatus>;

  /** Verify + parse an inbound webhook request from the provider.
   *  Throws if the signature is invalid. */
  handleWebhook(request: Request): Promise<KybVerificationEvent>;
}
