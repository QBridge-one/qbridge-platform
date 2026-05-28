// ============================================================
// lib/core/kyb-verification.ts
// Domain types for the KYB verification lifecycle (step 2 of
// issuer onboarding). Provider-agnostic — adapters translate from
// Persona / Sumsub / manual-review into these.
//
// Naming: "KYB case" is the platform's concept; providers call it
// "inquiry" (Persona) or "applicant" (Sumsub). The port + adapter
// bridge the vocabulary.
// ============================================================

/** Provider-agnostic case status. The stepper and notification
 *  service switch on this, not on provider-specific strings. */
export type KybCaseStatus =
  | "created"
  | "pending"
  | "needs_review"
  | "approved"
  | "declined"
  | "expired"
  | "failed";

/** Metadata attached to the case — stored in Clerk org publicMetadata
 *  alongside kybStatus so the platform can resume or display without
 *  hitting the provider API. */
export interface KybCase {
  /** Provider-assigned id (e.g. Persona inquiry id `inq_…`). */
  caseId: string;
  /** Which provider is managing this case. */
  provider: VerificationProvider;
  status: KybCaseStatus;
  /** URL where the issuer can resume the verification flow if they
   *  left before completing. Null once finalized. */
  resumeUrl: string | null;
  /** Provider dashboard link for ops reviewers. */
  reviewUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Event emitted by the webhook handler when a provider sends a
 *  status update. The onboarding service reacts to these. */
export interface KybVerificationEvent {
  /** Provider-assigned case id. */
  caseId: string;
  /** Our org id (set as reference_id when creating the case). */
  orgId: string;
  /** New status after this event. */
  status: KybCaseStatus;
  /** Provider-specific event name for audit logging. */
  providerEvent: string;
  /** Raw payload from the provider (stored in audit for forensics). */
  raw: Record<string, unknown>;
}

/** What is being verified. KYB = the legal entity; KYC = an
 *  individual (future: role-gated members). The port + adapters
 *  handle both; only KYB is wired into the UI today. */
export type VerificationType = "kyb" | "kyc";

/** Provider identifier — used for routing + storing which provider
 *  owns a given case. */
export type VerificationProvider = "persona" | "sumsub" | "manual";

/** Options for creating a new verification case. */
export interface CreateCaseInput {
  /** kyb = entity (subjectId is orgId); kyc = person (subjectId is
   *  userId). Defaults to "kyb" — KYC plumbing is not yet wired. */
  type?: VerificationType;
  /** The subject's id — org id for KYB, user id for KYC. Set as the
   *  provider's reference id so webhooks can route back. */
  orgId: string;
  /** Subject display name — entity name (KYB) or person name (KYC). */
  orgName: string;
  /** Primary contact email — some providers require this. */
  contactEmail: string;
  /** Jurisdiction (ISO country or free text) — drives provider
   *  routing (e.g. Canada KYB → Sumsub). */
  jurisdiction?: string;
  /** Additional fields the provider might need. */
  metadata?: Record<string, string>;
}

export interface CreateCaseResult {
  caseId: string;
  /** Which provider created the case — the client uses this to pick
   *  the matching widget (Persona modal vs Sumsub Web SDK). */
  provider: VerificationProvider;
  /** Credential the client-side widget needs to open the flow.
   *  Persona: the inquiry session token. Sumsub: the SDK access token. */
  sessionToken: string;
  status: KybCaseStatus;
}

/** Parse a KybCase from Clerk org publicMetadata. Returns null if the
 *  metadata doesn't contain a KYB case. */
export function kybCaseFromMetadata(meta: unknown): KybCase | null {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as Record<string, unknown>;
  const c = m.kybCase;
  if (!c || typeof c !== "object") return null;
  const x = c as Record<string, unknown>;
  if (typeof x.caseId !== "string" || typeof x.provider !== "string") return null;
  return {
    caseId: x.caseId,
    provider: x.provider as KybCase["provider"],
    status: (x.status as KybCaseStatus) ?? "created",
    resumeUrl: typeof x.resumeUrl === "string" ? x.resumeUrl : null,
    reviewUrl: typeof x.reviewUrl === "string" ? x.reviewUrl : null,
    createdAt: typeof x.createdAt === "string" ? x.createdAt : new Date().toISOString(),
    updatedAt: typeof x.updatedAt === "string" ? x.updatedAt : new Date().toISOString(),
  };
}
