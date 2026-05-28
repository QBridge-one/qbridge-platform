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

  if (event.status === "approved" || event.status === "declined") {
    await dispatchNotification(
      {
        notification: notificationAdapter,
        organization: organizationAdapter,
        email: emailAdapter,
      },
      {
        kind: event.status === "approved" ? "issuer.kyb_approved" : "issuer.kyb_rejected",
        orgId: org.id,
        payload:
          event.status === "approved"
            ? {
                issuerOrgId: org.id,
                issuerOrgName: org.name ?? org.slug ?? org.id,
                decidedByUserId: provider,
                decidedAt: new Date().toISOString(),
              }
            : {
                issuerOrgId: org.id,
                issuerOrgName: org.name ?? org.slug ?? org.id,
                decidedByUserId: provider,
                decidedAt: new Date().toISOString(),
                reason: "Verification declined by our compliance partner.",
              },
        recipients: [{ orgId: org.id, plane: "issuer", roles: ["issuer_admin"] }],
        dedupeKey: `${org.id}:${provider}:${event.status}:${event.caseId}`,
      },
    );
  }

  return { ok: true, status: event.status };
}
