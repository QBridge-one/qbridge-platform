// ============================================================
// lib/services/onboarding.service.ts
// Off-chain onboarding orchestration — issuer KYB submission.
// Depends only on ports; route handlers inject adapters from container.server.ts.
// ============================================================

import type { AppSession } from "../core/identity.types";
import { forbidden, issuerKybConflict } from "../core/errors";
import type { IssuerKybSubmitBody } from "../core/issuer-kyb";
import type { OrganizationPort } from "../ports/organization.port";
import type { AuditLogPort } from "../ports/audit-log.port";

/** Session must have resolved active org (enforced via requireOrg at the HTTP boundary). */
export type SessionWithActiveOrg = AppSession & {
  activeOrg: NonNullable<AppSession["activeOrg"]>;
};

export type OnboardingServiceDeps = {
  organization: OrganizationPort;
  audit: AuditLogPort;
};

/**
 * Persist KYB submission and append an audit record.
 * Throws `issuerKybConflict()` when status is already `submitted` or `approved`.
 */
export async function submitIssuerKybApplication(
  deps: OnboardingServiceDeps,
  input: {
    session: SessionWithActiveOrg;
    body: IssuerKybSubmitBody;
  },
): Promise<void> {
  const { activeOrg, user } = input.session;
  if (activeOrg.kind !== "issuer") {
    throw forbidden("Active organization must be an issuer workspace.");
  }
  const st = activeOrg.kybStatus;
  if (st === "approved" || st === "submitted") {
    throw issuerKybConflict();
  }

  await deps.organization.submitIssuerKyb(activeOrg.id, input.body);

  await deps.audit.append({
    orgId: activeOrg.id,
    actorUserId: user.id,
    action: "kyb.submitted",
    target: activeOrg.slug ?? activeOrg.id,
    payload: {
      orgName: activeOrg.name ?? null,
      legalEntityName: input.body.legalEntityName,
      jurisdiction: input.body.jurisdiction,
    },
  });
}
