// ============================================================
// POST /api/onboarding/kyb-verification/start
//
// Creates (or resumes) a KYB verification case for the active
// issuer org, routing to the provider chosen by selectKybProvider
// (jurisdiction-aware). Returns the provider + case id + session
// token so the client can open the matching widget (Persona modal
// or Sumsub Web SDK).
//
// Auth: requireOrg("issuer") — the issuer must be past step 1
// (kybStatus === "approved") to reach step 2.
// ============================================================

import { NextResponse } from "next/server";
import {
  auditLogAdapter,
  organizationAdapter,
  selectKybProvider,
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

    if (org.kybCase?.status === "approved") {
      return NextResponse.json({
        alreadyComplete: true,
        provider: org.kybCase.provider,
        caseId: org.kybCase.caseId,
      });
    }

    const jurisdiction = org.kybApplication?.jurisdiction ?? null;
    const provider = selectKybProvider({ jurisdiction });

    const result = await provider.createCase({
      type: "kyb",
      orgId: org.id,
      orgName: org.name ?? org.slug ?? org.id,
      contactEmail: session.user.email,
      jurisdiction: jurisdiction ?? undefined,
    });

    await organizationAdapter.updateOrgMetadata(org.id, {
      kybCase: {
        caseId: result.caseId,
        provider: result.provider,
        status: result.status,
        resumeUrl:
          result.provider === "persona"
            ? `https://withpersona.com/verify?inquiry-id=${result.caseId}`
            : null,
        reviewUrl:
          result.provider === "persona"
            ? `https://app.withpersona.com/inquiries/${result.caseId}`
            : `https://cockpit.sumsub.com/checkus/#/applicant/${result.caseId}`,
        createdAt: org.kybCase?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    await auditLogAdapter.append({
      orgId: org.id,
      actorUserId: session.user.id,
      action: "ops.action",
      target: result.caseId,
      payload: { type: "kyb_verification.started", provider: result.provider },
    });

    return NextResponse.json({
      provider: result.provider,
      caseId: result.caseId,
      sessionToken: result.sessionToken,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
