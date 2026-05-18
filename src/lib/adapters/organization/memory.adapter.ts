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
import type { IssuerKybSubmitBody } from "../../core/issuer-kyb";
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

  async submitIssuerKyb(orgId: string, body: IssuerKybSubmitBody): Promise<AppOrg> {
    const org = memoryOrganizationStore.getOrg(orgId);
    if (!org) throw orgNotFound(orgId);
    if (org.kind !== "issuer") throw forbidden("Only issuer workspaces go through KYB onboarding.");
    return memoryOrganizationStore.submitIssuerKyb(orgId, body);
  }

  async updateMemberRole(
    orgId: string,
    userId: string,
    appRole: AppRole,
  ): Promise<OrgMember> {
    return this.setMemberRoles(orgId, userId, [appRole]);
  }

  async setMemberRoles(
    orgId: string,
    userId: string,
    appRoles: AppRole[],
  ): Promise<OrgMember> {
    const org = memoryOrganizationStore.getOrg(orgId);
    if (!org) throw orgNotFound(orgId);
    if (memoryOrganizationStore.rolesOf(orgId, userId) === null) {
      throw membershipNotFound();
    }
    if (appRoles.length === 0) {
      throw forbidden("At least one app role is required.");
    }
    // plane sanity: every role must belong to this org's plane.
    const wantsOps = org.kind === "ops";
    for (const r of appRoles) {
      const rIsOps = r.startsWith("ops_");
      if (rIsOps !== wantsOps) {
        throw forbidden(`Role "${r}" does not belong to a ${org.kind} workspace.`);
      }
    }
    return memoryOrganizationStore.upsertMember(orgId, userId, appRoles, "active");
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
