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

export interface OrganizationPort {
  // ── Read ─────────────────────────────────────────────────
  getOrg(orgId: string): Promise<AppOrg | null>;
  listForUser(userId: string): Promise<AppOrg[]>;
  listMembers(orgId: string): Promise<OrgMember[]>;
  listInvites(orgId: string): Promise<Invite[]>;

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

  // ── Membership ───────────────────────────────────────────
  updateMemberRole(
    orgId: string,
    userId: string,
    appRole: AppRole,
  ): Promise<OrgMember>;
  removeMember(orgId: string, userId: string): Promise<void>;
}
