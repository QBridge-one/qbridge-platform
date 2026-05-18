// ============================================================
// lib/ports/organization.port.ts
// Organization & membership port.
// Implemented by: ClerkOrganizationAdapter, MemoryOrganizationAdapter,
// (future) WorkOSOrganizationAdapter.
// ============================================================

import type {
  AppOrg,
  AppRole,
  Invite,
  InviteInput,
  OrgKind,
  OrgMember,
} from "../core/identity.types";
import type { IssuerKybDecisionInput, IssuerKybSubmitBody } from "../core/issuer-kyb";

export interface OrganizationPort {
  // ── Read ─────────────────────────────────────────────────
  getOrg(orgId: string): Promise<AppOrg | null>;
  listForUser(userId: string): Promise<AppOrg[]>;
  listMembers(orgId: string): Promise<OrgMember[]>;
  listInvites(orgId: string): Promise<Invite[]>;
  /** Cross-tenant listing — used by ops for the issuer review queue.
   *  The Clerk adapter pages through `getOrganizationList` and filters
   *  client-side; callers should treat this as moderately expensive
   *  and avoid request-time use without a small `limit`. */
  listOrgs(filter?: { kind?: OrgKind; limit?: number }): Promise<AppOrg[]>;

  // ── Lifecycle ────────────────────────────────────────────
  createOrg(input: {
    name: string;
    slug?: string;
    kind: OrgKind;
    issuerId?: string | null;
    creatorUserId: string;
  }): Promise<AppOrg>;

  // ── Invitations ──────────────────────────────────────────
  inviteMember(
    orgId: string,
    invitedByUserId: string,
    input: InviteInput,
  ): Promise<Invite>;
  revokeInvite(orgId: string, inviteId: string): Promise<void>;

  /** Issuer onboarding: persists snapshot + sets kybStatus to `submitted`. */
  submitIssuerKyb(orgId: string, body: IssuerKybSubmitBody): Promise<AppOrg>;

  /** Ops decision: flips kybStatus to `approved` or `rejected`, records
   *  reviewer + (optional) reason on the org. Throws `issuerKybConflict()`
   *  when the org is not currently `submitted`. Throws `forbidden()` for
   *  ops/non-issuer orgs. */
  setIssuerKybDecision(orgId: string, input: IssuerKybDecisionInput): Promise<AppOrg>;

  // ── Membership ───────────────────────────────────────────
  /** @deprecated Use setMemberRoles. Sets the primary role to a single
   *  value (replaces appRoles with [appRole]). Kept for back-compat. */
  updateMemberRole(
    orgId: string,
    userId: string,
    appRole: AppRole,
  ): Promise<OrgMember>;
  /** Replace the full set of off-chain roles for a member. The Clerk
   *  coarse role (admin/member) is derived from whether any role in
   *  the set ends with "_admin". Throws if any role's plane doesn't
   *  match the org's plane. */
  setMemberRoles(
    orgId: string,
    userId: string,
    appRoles: AppRole[],
  ): Promise<OrgMember>;
  removeMember(orgId: string, userId: string): Promise<void>;
}
