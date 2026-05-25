// ============================================================
// lib/contracts/issuer-registry-payload.ts
//
// Deterministic mapping from off-chain KYB data → registerIssuer(args).
// See docs/issuer-registry-integration.md.
// ============================================================

import { keccak256, stringToBytes } from "viem";
import type { Address } from "../core/types";
import type { IssuerKybApplication, IssuerKybStatus } from "../core/issuer-kyb";
import type { AppOrg, OrgMember } from "../core/identity.types";

export type Bytes32 = `0x${string}`;

/** Arguments passed to IssuerRegistry.registerIssuer (and useRegisterIssuer). */
export interface RegisterIssuerPayload {
  wallet: Address;
  entityId: Bytes32;
  kybDocumentHash: Bytes32;
}

/** Stable JSON object hashed for kybDocumentHash — key order is fixed. */
export function canonicalKybSnapshot(app: IssuerKybApplication): {
  legalEntityName: string;
  jurisdiction: string;
  companyWebsite: string;
  notes: string;
  submittedAt: string;
} {
  return {
    legalEntityName: app.legalEntityName,
    jurisdiction: app.jurisdiction,
    companyWebsite: app.companyWebsite ?? "",
    notes: app.notes ?? "",
    submittedAt: app.submittedAt,
  };
}

/** bytes32 entity id from Clerk org id — stable for the lifetime of the org. */
export function entityIdFromOrgId(orgId: string): Bytes32 {
  return keccak256(stringToBytes(orgId));
}

/** bytes32 fingerprint of the KYB application snapshot at approval time. */
export function kybDocumentHashFromApplication(app: IssuerKybApplication): Bytes32 {
  const canonical = JSON.stringify(canonicalKybSnapshot(app));
  return keccak256(stringToBytes(canonical));
}

/** Build the full registerIssuer payload from off-chain sources. */
export function buildRegisterIssuerPayload(input: {
  orgId: string;
  application: IssuerKybApplication;
  issuerWallet: Address;
}): RegisterIssuerPayload {
  return {
    wallet: input.issuerWallet,
    entityId: entityIdFromOrgId(input.orgId),
    kybDocumentHash: kybDocumentHashFromApplication(input.application),
  };
}

export type IssuerAdminMemberRef = Pick<
  OrgMember,
  "userId" | "email" | "displayName" | "walletAddress"
>;

type IssuerAdminMemberCandidate = Pick<
  OrgMember,
  "appRoles" | "walletAddress" | "status" | "userId" | "email" | "displayName"
>;

/** First active issuer_admin in the org (wallet may still be unlinked). */
export function findIssuerAdminMember(
  members: ReadonlyArray<IssuerAdminMemberCandidate>,
): IssuerAdminMemberRef | null {
  for (const member of members) {
    if (member.status !== "active") continue;
    if (!member.appRoles.includes("issuer_admin")) continue;
    return {
      userId: member.userId,
      email: member.email,
      displayName: member.displayName,
      walletAddress: member.walletAddress,
    };
  }
  return null;
}

/**
 * First active issuer_admin with a linked wallet — the address registered
 * on IssuerRegistry for this org.
 */
export function resolveIssuerAdminWallet(
  members: ReadonlyArray<IssuerAdminMemberCandidate>,
): Address | null {
  const admin = findIssuerAdminMember(members);
  return admin?.walletAddress ?? null;
}

/** Server + client shape for GET /api/ops/issuers/:orgId/registration-context. */
export interface IssuerRegistrationContext {
  orgId: string;
  kybStatus: IssuerKybStatus;
  entityId: Bytes32;
  kybDocumentHash: Bytes32 | null;
  issuerAdmin: IssuerAdminMemberRef | null;
  registerIssuer: RegisterIssuerPayload | null;
  /** Human-readable reasons registerIssuer is unavailable — empty when ready. */
  registrationBlockers: string[];
}

export function buildIssuerRegistrationContext(input: {
  org: AppOrg;
  members: OrgMember[];
}): IssuerRegistrationContext {
  const { org, members } = input;
  const kybStatus = org.kybStatus ?? "none";
  const entityId = entityIdFromOrgId(org.id);
  const application = org.kybApplication;
  const kybDocumentHash = application ? kybDocumentHashFromApplication(application) : null;
  const issuerAdmin = findIssuerAdminMember(members);

  const registrationBlockers: string[] = [];
  if (kybStatus !== "approved") {
    registrationBlockers.push("KYB must be approved before on-chain registration.");
  }
  if (!application) {
    registrationBlockers.push("No KYB application on file.");
  }
  if (!issuerAdmin) {
    registrationBlockers.push("No active issuer admin found in this workspace.");
  } else if (!issuerAdmin.walletAddress) {
    registrationBlockers.push("Issuer admin has not linked a wallet.");
  }

  let registerIssuer: RegisterIssuerPayload | null = null;
  if (
    registrationBlockers.length === 0 &&
    issuerAdmin?.walletAddress &&
    application
  ) {
    registerIssuer = buildRegisterIssuerPayload({
      orgId: org.id,
      application,
      issuerWallet: issuerAdmin.walletAddress,
    });
  }

  return {
    orgId: org.id,
    kybStatus,
    entityId,
    kybDocumentHash,
    issuerAdmin,
    registerIssuer,
    registrationBlockers,
  };
}
