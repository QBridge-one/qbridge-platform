// ============================================================
// lib/services/kyb-webhook.service.ts
// Shared post-webhook handling for KYB verification providers.
//
// Both /api/webhooks/persona and /api/webhooks/sumsub verify their
// own signature + normalize the payload into a KybVerificationEvent,
// then hand off here. This keeps the "update org metadata + notify
// issuer" logic in one place regardless of provider.
// ============================================================

import "server-only";

import {
  auditLogAdapter,
  emailAdapter,
  notificationAdapter,
  OPS_ORG_ID,
  organizationAdapter,
} from "../container.server";
import type {
  KybCaseStatus,
  KybVerificationEvent,
  VerificationProvider,
} from "../core/kyb-verification";
import { dispatchNotification } from "./notification.service";

const TERMINAL_STATUSES: ReadonlySet<KybCaseStatus> = new Set([
  "approved",
  "declined",
  "failed",
]);

function reviewUrlFor(provider: VerificationProvider, caseId: string): string {
  return provider === "persona"
    ? `https://app.withpersona.com/inquiries/${caseId}`
    : `https://cockpit.sumsub.com/checkus/#/applicant/${caseId}`;
}

function resumeUrlFor(
  provider: VerificationProvider,
  caseId: string,
  status: KybCaseStatus,
): string | null {
  if (TERMINAL_STATUSES.has(status)) return null;
  if (provider === "persona") {
    return `https://withpersona.com/verify?inquiry-id=${caseId}`;
  }
  // Sumsub resumes inside the embedded SDK via a fresh access token,
  // not a standalone URL.
  return null;
}

export interface ProcessResult {
  ok: true;
  status?: KybCaseStatus;
  skipped?: string;
}

/** Apply a normalized verification event: update the org's kybCase
 *  snapshot, append audit, and notify issuer admins on terminal
 *  approve/decline. Idempotent via the notification dedupeKey. */
export async function processKybEvent(
  event: KybVerificationEvent,
  provider: VerificationProvider,
): Promise<ProcessResult> {
  if (!event.orgId) {
    return { ok: true, skipped: "no reference/external id" };
  }

  const org = await organizationAdapter.getOrg(event.orgId);
  if (!org || org.kind !== "issuer") {
    return { ok: true, skipped: "org not found or not issuer" };
  }

  await organizationAdapter.updateOrgMetadata(org.id, {
    kybCase: {
      caseId: event.caseId,
      provider,
      status: event.status,
      resumeUrl: resumeUrlFor(provider, event.caseId, event.status),
      reviewUrl: reviewUrlFor(provider, event.caseId),
      createdAt: org.kybCase?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  await auditLogAdapter.append({
    orgId: org.id,
    actorUserId: "system",
    action: "ops.action",
    target: event.caseId,
    payload: {
      type: `${provider}.webhook`,
      event: event.providerEvent,
      status: event.status,
    },
  });

  const orgName = org.name ?? org.slug ?? org.id;
  const occurredAt = new Date().toISOString();
  const deps = {
    notification: notificationAdapter,
    organization: organizationAdapter,
    email: emailAdapter,
  };

  if (event.status === "approved") {
    // Identity verified by Sumsub/Persona — page OPS to do the
    // on-chain registration. The issuer is NOT told "workspace
    // active" yet; that's the on-chain step, fired separately
    // from /api/ops/issuers/[orgId]/registry/confirm.
    if (OPS_ORG_ID) {
      await dispatchNotification(deps, {
        kind: "issuer.kyb_verified",
        orgId: org.id,
        payload: {
          issuerOrgId: org.id,
          issuerOrgName: orgName,
          provider,
          caseId: event.caseId,
          verifiedAt: occurredAt,
        },
        recipients: [
          {
            orgId: OPS_ORG_ID,
            plane: "ops",
            roles: ["ops_admin", "ops_onboarding", "ops_engineer"],
          },
        ],
        dedupeKey: `${org.id}:${provider}:verified:${event.caseId}`,
      });
    }
  } else if (event.status === "declined" || event.status === "failed") {
    // Identity check failed — tell the issuer admin.
    await dispatchNotification(deps, {
      kind: "issuer.kyb_failed",
      orgId: org.id,
      payload: {
        issuerOrgId: org.id,
        issuerOrgName: orgName,
        provider,
        caseId: event.caseId,
        failedAt: occurredAt,
        reason:
          event.status === "declined"
            ? "Verification declined by our compliance partner."
            : "Identity verification could not complete.",
      },
      recipients: [{ orgId: org.id, plane: "issuer", roles: ["issuer_admin"] }],
      dedupeKey: `${org.id}:${provider}:${event.status}:${event.caseId}`,
    });
  }

  return { ok: true, status: event.status };
}
