// ============================================================
// issuer-kyb.ts
// KYB lifecycle for issuer organizations (plane = "issuer").
// Ops workspaces never run this gate — use kind + kybStatus on AppOrg.
// ============================================================

export type IssuerKybStatus =
  | "none"
  | "draft"
  | "submitted"
  | "approved"
  | "rejected";

export interface IssuerKybApplication {
  legalEntityName: string;
  jurisdiction: string;
  companyWebsite: string | null;
  notes: string | null;
  submittedAt: string;
}

const KNOWN_STATUSES: readonly IssuerKybStatus[] = [
  "none",
  "draft",
  "submitted",
  "approved",
  "rejected",
] as const;

export function parseIssuerKybStatusField(v: unknown): IssuerKybStatus {
  if (typeof v === "string" && (KNOWN_STATUSES as readonly string[]).includes(v)) {
    return v as IssuerKybStatus;
  }
  return "none";
}

/** True until ops sets org publicMetadata.kybStatus to `"approved"` in Clerk (or equivalent). */
export function issuerWorkspaceKybBlocks(kind: "ops" | "issuer", kybStatus: IssuerKybStatus | null): boolean {
  return kind === "issuer" && kybStatus !== "approved";
}

export function issuerKybApplicationFromMetadata(meta: unknown): IssuerKybApplication | null {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as Record<string, unknown>;
  const app = m.kybApplication;
  if (!app || typeof app !== "object") return null;
  const a = app as Record<string, unknown>;
  if (typeof a.legalEntityName !== "string" || typeof a.jurisdiction !== "string") return null;
  if (typeof a.submittedAt !== "string") return null;
  return {
    legalEntityName: a.legalEntityName,
    jurisdiction: a.jurisdiction,
    companyWebsite: typeof a.companyWebsite === "string" ? a.companyWebsite : null,
    notes: typeof a.notes === "string" ? a.notes : null,
    submittedAt: a.submittedAt,
  };
}

/** Body accepted by POST /api/onboarding/kyb (server adds submittedAt). */
export type IssuerKybSubmitBody = {
  legalEntityName: string;
  jurisdiction: string;
  companyWebsite?: string | null;
  notes?: string | null;
};
