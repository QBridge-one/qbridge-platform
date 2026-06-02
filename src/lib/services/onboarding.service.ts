// ============================================================
// lib/services/onboarding.service.ts
// Off-chain onboarding orchestration — issuer KYB submission +
// ops decision (approve / reject).
// Depends only on ports; route handlers inject adapters from container.server.ts.
// ============================================================

import type { AppSession } from "../core/identity.types";
import { forbidden, issuerKybConflict, orgNotFound } from "../core/errors";
import type { IssuerKybDecision, IssuerKybSubmitBody } from "../core/issuer-kyb";
import type { OrganizationPort } from "../ports/organization.port";
import type { AuditLogPort } from "../ports/audit-log.port";
import {
  dispatchNotification,
  type NotificationServiceDeps,
} from "./notification.service";

/** Session must have resolved active org (enforced via requireOrg at the HTTP boundary). */
export type SessionWithActiveOrg = AppSession & {
  activeOrg: NonNullable<AppSession["activeOrg"]>;
};

export type OnboardingServiceDeps = {
  organization: OrganizationPort;
  audit: AuditLogPort;
} & NotificationServiceDeps;

/**
 * Persist KYB submission, append an audit record, and notify
 * ops_admin/ops_onboarding members of the configured ops org.
 *
 * Throws `issuerKybConflict()` when status is already `submitted` or `approved`.
 *
 * `opsOrgId` is the org id of the QBridge ops workspace. Passing it
 * explicitly (rather than discovering via the port) keeps the
 * OrganizationPort surface small; the route handler reads OPS_ORG_ID
 * from env and forwards it.
 */
export async function submitIssuerKybApplication(
  deps: OnboardingServiceDeps,
  input: {
    session: SessionWithActiveOrg;
    body: IssuerKybSubmitBody;
    opsOrgId: string | null;
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

  const updated = await deps.organization.submitIssuerKyb(activeOrg.id, input.body);

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

  if (input.opsOrgId) {
    await dispatchNotification(deps, {
      kind: "issuer.kyb_submitted",
      orgId: activeOrg.id,
      payload: {
        issuerOrgId: activeOrg.id,
        issuerOrgName: activeOrg.name ?? activeOrg.slug ?? activeOrg.id,
        legalEntityName: input.body.legalEntityName,
        jurisdiction: input.body.jurisdiction,
        submittedByUserId: user.id,
        submittedAt:
          updated.kybApplication?.submittedAt ?? new Date().toISOString(),
      },
      recipients: [
        {
          orgId: input.opsOrgId,
          plane: "ops",
          roles: ["ops_admin", "ops_onboarding"],
        },
      ],
      // Coalesce a re-submit (after a rejection) with any racing webhook.
      dedupeKey: `${activeOrg.id}:${updated.kybApplication?.submittedAt ?? ""}`,
    });
  }
}

/**
 * Ops decision on a submitted issuer KYB application. Flips
 * kybStatus to approved/rejected, appends audit, and notifies the
 * issuer's admins.
 *
 * The actor's permission check is the route handler's job
 * (requireRole on ops_admin / ops_onboarding); this service trusts
 * its caller to have authenticated + authorized the actor.
 *
 * Throws `issuerKybConflict()` if the target is not currently
 * `submitted`. Throws `orgNotFound()` / `forbidden()` for invalid
 * target orgs.
 */
export async function decideIssuerKyb(
  deps: OnboardingServiceDeps,
  input: {
    actorSession: AppSession;
    targetIssuerOrgId: string;
    decision: IssuerKybDecision;
    reason?: string | null;
  },
): Promise<void> {
  const { actorSession, targetIssuerOrgId, decision } = input;
  const target = await deps.organization.getOrg(targetIssuerOrgId);
  if (!target) throw orgNotFound(targetIssuerOrgId);
  if (target.kind !== "issuer") {
    throw forbidden("Only issuer workspaces have KYB decisions.");
  }
  if (target.kybStatus !== "submitted") {
    throw issuerKybConflict();
  }
  if (decision === "rejected") {
    const reason = (input.reason ?? "").trim();
    if (reason.length === 0) {
      throw forbidden("A reason is required when rejecting a KYB application.");
    }
  }

  const updated = await deps.organization.setIssuerKybDecision(targetIssuerOrgId, {
    decision,
    decidedByUserId: actorSession.user.id,
    reason: input.reason ?? null,
  });

  await deps.audit.append({
    orgId: target.id,
    actorUserId: actorSession.user.id,
    action: decision === "approved" ? "kyb.approved" : "kyb.rejected",
    target: target.slug ?? target.id,
    payload: {
      orgName: target.name ?? null,
      decision,
      reason: input.reason ?? null,
    },
  });

  const decidedAt = updated.kybReview?.decidedAt ?? new Date().toISOString();
  await dispatchNotification(deps, {
    kind: decision === "approved" ? "issuer.application_approved" : "issuer.application_rejected",
    orgId: target.id,
    payload:
      decision === "approved"
        ? {
            issuerOrgId: target.id,
            issuerOrgName: target.name ?? target.slug ?? target.id,
            decidedByUserId: actorSession.user.id,
            decidedAt,
          }
        : {
            issuerOrgId: target.id,
            issuerOrgName: target.name ?? target.slug ?? target.id,
            decidedByUserId: actorSession.user.id,
            decidedAt,
            reason: input.reason ?? null,
          },
    recipients: [
      {
        orgId: target.id,
        plane: "issuer",
        roles: ["issuer_admin"],
      },
    ],
    // The (orgId, decidedAt) pair is stable across the UI emit + the
    // Clerk webhook backup re-emit, so they collapse into one fanout.
    dedupeKey: `${target.id}:application_${decision}:${decidedAt}`,
  });
}
