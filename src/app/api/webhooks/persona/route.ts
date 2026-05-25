// ============================================================
// POST /api/webhooks/persona
//
// Receives Persona inquiry lifecycle events (inquiry.completed,
// inquiry.approved, inquiry.declined, etc.) and updates the
// issuer org's kybCase status + fires notifications.
//
// Public endpoint — no session required. Auth is via HMAC
// signature in the Persona-Signature header.
// ============================================================

import { NextResponse } from "next/server";
import {
  auditLogAdapter,
  emailAdapter,
  kybVerificationAdapter,
  notificationAdapter,
  organizationAdapter,
} from "@/lib/container.server";
import { errorResponse } from "@/lib/auth/api";
import type { KybCaseStatus } from "@/lib/core/kyb-verification";

const TERMINAL_STATUSES: ReadonlySet<KybCaseStatus> = new Set([
  "approved",
  "declined",
  "failed",
]);

export async function POST(request: Request) {
  try {
    const event = await kybVerificationAdapter.handleWebhook(request);

    if (!event.orgId) {
      return NextResponse.json({ ok: true, skipped: "no reference-id" });
    }

    const org = await organizationAdapter.getOrg(event.orgId);
    if (!org || org.kind !== "issuer") {
      return NextResponse.json({ ok: true, skipped: "org not found or not issuer" });
    }

    // Update the kybCase snapshot in Clerk org metadata.
    await organizationAdapter.updateOrgMetadata(org.id, {
      kybCase: {
        caseId: event.caseId,
        provider: "persona",
        status: event.status,
        resumeUrl: TERMINAL_STATUSES.has(event.status) ? null : `https://withpersona.com/verify?inquiry-id=${event.caseId}`,
        reviewUrl: `https://app.withpersona.com/inquiries/${event.caseId}`,
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
        type: "persona.webhook",
        event: event.providerEvent,
        status: event.status,
      },
    });

    // When Persona approves or declines, notify the issuer admins.
    if (event.status === "approved" || event.status === "declined") {
      const { dispatchNotification } = await import("@/lib/services/notification.service");
      const deps = {
        notification: notificationAdapter,
        organization: organizationAdapter,
        email: emailAdapter,
      };
      await dispatchNotification(deps, {
        kind: event.status === "approved" ? "issuer.kyb_approved" : "issuer.kyb_rejected",
        orgId: org.id,
        payload:
          event.status === "approved"
            ? {
                issuerOrgId: org.id,
                issuerOrgName: org.name ?? org.slug ?? org.id,
                decidedByUserId: "persona",
                decidedAt: new Date().toISOString(),
              }
            : {
                issuerOrgId: org.id,
                issuerOrgName: org.name ?? org.slug ?? org.id,
                decidedByUserId: "persona",
                decidedAt: new Date().toISOString(),
                reason: "Verification declined by our compliance partner.",
              },
        recipients: [
          { orgId: org.id, plane: "issuer", roles: ["issuer_admin"] },
        ],
        dedupeKey: `${org.id}:persona:${event.status}:${event.caseId}`,
      });
    }

    return NextResponse.json({ ok: true, status: event.status });
  } catch (err) {
    return errorResponse(err);
  }
}
