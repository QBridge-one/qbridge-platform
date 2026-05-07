// ============================================================
// lib/adapters/organization/memory.adapter.ts
// In-memory OrganizationPort — used in dev / preview.
// Replace by ClerkOrganizationAdapter in production.
// ============================================================

import type { OrganizationPort } from "../../ports/organization.port";
import type {
  AppOrg,
  AppRole,
  Invite,
  InviteInput,
  OrgKind,
  OrgMember,
} from "../../core/identity.types";
import {
  forbidden,
  inviteAlreadyExists,
  inviteNotFound,
  membershipNotFound,
  orgNotFound,
} from "../../core/errors";
import { memoryOrganizationStore } from "./memory.store";

class MemoryOrganizationAdapter implements OrganizationPort {
  async getOrg(orgId: string): Promise<AppOrg | null> {
    return memoryOrganizationStore.getOrg(orgId);
  }

  async listForUser(userId: string): Promise<AppOrg[]> {
    return memoryOrganizationStore.listForUser(userId);
  }

  async listMembers(orgId: string): Promise<OrgMember[]> {
    if (!memoryOrganizationStore.getOrg(orgId)) throw orgNotFound(orgId);
    return memoryOrganizationStore.listMembers(orgId);
  }

  async listInvites(orgId: string): Promise<Invite[]> {
    if (!memoryOrganizationStore.getOrg(orgId)) throw orgNotFound(orgId);
    return memoryOrganizationStore.listInvites(orgId);
  }

  async createOrg(input: {
    name: string;
    slug?: string;
    kind: OrgKind;
    issuerId?: string | null;
    creatorUserId: string;
  }): Promise<AppOrg> {
    return memoryOrganizationStore.createOrg(input);
  }

  async inviteMember(
    orgId: string,
    invitedByUserId: string,
    input: InviteInput,
  ): Promise<Invite> {
    const org = memoryOrganizationStore.getOrg(orgId);
    if (!org) throw orgNotFound(orgId);
    // role/plane sanity: ops-only roles must go to ops org and vice versa
    const isOpsRole = input.appRole.startsWith("ops_");
    if ((isOpsRole && org.kind !== "ops") || (!isOpsRole && org.kind === "ops")) {
      throw forbidden("App role does not match organization plane.");
    }
    const existing = memoryOrganizationStore.findPendingInvite(orgId, input.email);
    if (existing) throw inviteAlreadyExists(input.email);
    return memoryOrganizationStore.createInvite(orgId, invitedByUserId, input);
  }

  async revokeInvite(orgId: string, inviteId: string): Promise<void> {
    if (!memoryOrganizationStore.getOrg(orgId)) throw orgNotFound(orgId);
    const inv = memoryOrganizationStore.setInviteStatus(orgId, inviteId, "revoked");
    if (!inv) throw inviteNotFound(inviteId);
  }

  async updateMemberRole(
    orgId: string,
    userId: string,
    appRole: AppRole,
  ): Promise<OrgMember> {
    if (!memoryOrganizationStore.getOrg(orgId)) throw orgNotFound(orgId);
    const existing = memoryOrganizationStore.roleOf(orgId, userId);
    if (existing === null) throw membershipNotFound();
    return memoryOrganizationStore.upsertMember(orgId, userId, appRole, "active");
  }

  async removeMember(orgId: string, userId: string): Promise<void> {
    if (!memoryOrganizationStore.getOrg(orgId)) throw orgNotFound(orgId);
    if (memoryOrganizationStore.roleOf(orgId, userId) === null) {
      throw membershipNotFound();
    }
    memoryOrganizationStore.removeMember(orgId, userId);
  }
}

export const memoryOrganizationAdapter = new MemoryOrganizationAdapter();
