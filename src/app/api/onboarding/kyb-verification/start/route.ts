// ============================================================
// POST /api/onboarding/kyb-verification/start
//
// Creates (or resumes) a Persona inquiry for the active issuer
// org. Returns the inquiry id + session token so the client can
// open the embedded Persona widget.
//
// Auth: requireOrg("issuer") — the issuer must be past step 1
// (kybStatus === "approved") to reach step 2.
// ============================================================

import { NextResponse } from "next/server";
import {
  auditLogAdapter,
  kybVerificationAdapter,
  organizationAdapter,
} from "@/lib/container.server";
import { errorResponse } from "@/lib/auth/api";
import { requireOrg } from "@/lib/auth/server";
import { forbidden } from "@/lib/core/errors";

export async function POST() {
  try {
    const session = await requireOrg("issuer");
    const org = session.activeOrg;

    if (org.kybStatus !== "approved") {
      throw forbidden("Complete the issuer application (step 1) before starting KYB verification.");
    }

    // If a case already exists and is terminal, block re-creation.
    if (org.kybCase?.status === "approved") {
      return NextResponse.json({
        alreadyComplete: true,
        caseId: org.kybCase.caseId,
      });
    }

    const result = await kybVerificationAdapter.createCase({
      orgId: org.id,
      orgName: org.name ?? org.slug ?? org.id,
      contactEmail: session.user.email,
    });

    await organizationAdapter.updateOrgMetadata(org.id, {
      kybCase: {
        caseId: result.caseId,
        provider: "persona",
        status: result.status,
        resumeUrl: `https://withpersona.com/verify?inquiry-id=${result.caseId}`,
        reviewUrl: `https://app.withpersona.com/inquiries/${result.caseId}`,
        createdAt: org.kybCase?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    await auditLogAdapter.append({
      orgId: org.id,
      actorUserId: session.user.id,
      action: "ops.action",
      target: result.caseId,
      payload: { type: "kyb_verification.started", provider: "persona" },
    });

    return NextResponse.json({
      inquiryId: result.caseId,
      sessionToken: result.sessionToken,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
