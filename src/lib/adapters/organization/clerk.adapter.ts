// ============================================================
// lib/adapters/organization/clerk.adapter.ts
// Clerk implementation of OrganizationPort.
// Activated when IDENTITY_PROVIDER=clerk.
//
// Mapping conventions:
//   - Clerk Organization ↔ AppOrg
//   - publicMetadata.kind: "ops" | "issuer"  (we set this on create)
//   - publicMetadata.issuerId: string         (KYB record id)
//   - role "org:admin" / "org:member" → AppRole via mapRoleFromClerk
// ============================================================

import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
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
import {
  mapRoleFromClerk,
  mapRoleToClerk,
  readAppRolesFromMetadata,
} from "../identity/clerk.adapter";

type ClerkOrg = Awaited<ReturnType<Awaited<ReturnType<typeof clerkClient>>["organizations"]["getOrganization"]>>;
type ClerkMember = Awaited<
  ReturnType<Awaited<ReturnType<typeof clerkClient>>["organizations"]["getOrganizationMembershipList"]>
>["data"][number];
type ClerkInvite = Awaited<
  ReturnType<Awaited<ReturnType<typeof clerkClient>>["organizations"]["getOrganizationInvitationList"]>
>["data"][number];

function mapKindFromMetadata(meta: unknown): "ops" | "issuer" {
  if (meta && typeof meta === "object" && (meta as { kind?: unknown }).kind === "ops") return "ops";
  return "issuer";
}

function pickIssuerId(meta: unknown): string | null {
  if (meta && typeof meta === "object" && "issuerId" in meta) {
    const v = (meta as { issuerId?: unknown }).issuerId;
    if (typeof v === "string") return v;
  }
  return null;
}

function mapOrg(o: ClerkOrg): AppOrg {
  const kind = mapKindFromMetadata(o.publicMetadata);
  return {
    id: o.id,
    authOrgId: o.id,
    name: o.name,
    slug: o.slug ?? o.id,
    kind,
    issuerId: pickIssuerId(o.publicMetadata),
    createdAt: new Date(o.createdAt).toISOString(),
  };
}

function mapMember(m: ClerkMember, kind: OrgKind): OrgMember {
  const ud = m.publicUserData;
  const id = ud?.userId ?? m.id;
  const fromMeta = readAppRolesFromMetadata(m.publicMetadata);
  const appRoles =
    fromMeta && fromMeta.length > 0 ? fromMeta : [mapRoleFromClerk(m.role, kind)];
  return {
    userId: id,
    orgId: m.organization.id,
    email: ud?.identifier ?? "",
    displayName:
      [ud?.firstName, ud?.lastName].filter(Boolean).join(" ") || (ud?.identifier ?? null),
    imageUrl: ud?.imageUrl ?? null,
    appRoles,
    appRole: appRoles[0],
    status: "active",
    walletAddress: null,
    joinedAt: new Date(m.createdAt).toISOString(),
    lastActiveAt: m.updatedAt ? new Date(m.updatedAt).toISOString() : null,
  };
}

function mapInviteStatus(s: ClerkInvite["status"]): Invite["status"] {
  if (s === "accepted") return "accepted";
  if (s === "revoked") return "revoked";
  if (s === "expired") return "expired";
  return "pending";
}

function mapInvite(inv: ClerkInvite): Invite {
  const fromMeta = readAppRolesFromMetadata(inv.publicMetadata);
  const appRoles = fromMeta && fromMeta.length > 0 ? fromMeta : ["issuer_member" as AppRole];
  return {
    id: inv.id,
    orgId: inv.organizationId,
    email: inv.emailAddress,
    appRole: appRoles[0],
    appRoles,
    status: mapInviteStatus(inv.status),
    invitedBy: "system",
    createdAt: new Date(inv.createdAt).toISOString(),
    acceptedAt: inv.status === "accepted" ? new Date(inv.updatedAt).toISOString() : null,
  };
}

class ClerkOrganizationAdapter implements OrganizationPort {
  async getOrg(orgId: string): Promise<AppOrg | null> {
    const cc = await clerkClient();
    try {
      const o = await cc.organizations.getOrganization({ organizationId: orgId });
      return mapOrg(o);
    } catch {
      return null;
    }
  }

  async listForUser(userId: string): Promise<AppOrg[]> {
    const cc = await clerkClient();
    const list = await cc.users.getOrganizationMembershipList({ userId });
    return list.data.map((m) => mapOrg(m.organization));
  }

  async listMembers(orgId: string): Promise<OrgMember[]> {
    const cc = await clerkClient();
    const org = await cc.organizations.getOrganization({ organizationId: orgId }).catch(() => null);
    if (!org) throw orgNotFound(orgId);
    const kind = mapKindFromMetadata(org.publicMetadata);
    const list = await cc.organizations.getOrganizationMembershipList({ organizationId: orgId });
    return list.data.map((m) => mapMember(m, kind));
  }

  async listInvites(orgId: string): Promise<Invite[]> {
    const cc = await clerkClient();
    const list = await cc.organizations.getOrganizationInvitationList({
      organizationId: orgId,
      status: ["pending"],
    });
    return list.data.map(mapInvite);
  }

  async createOrg(input: {
    name: string;
    slug?: string;
    kind: OrgKind;
    issuerId?: string | null;
    creatorUserId: string;
  }): Promise<AppOrg> {
    const cc = await clerkClient();
    const o = await cc.organizations.createOrganization({
      name: input.name,
      slug: input.slug,
      createdBy: input.creatorUserId,
      publicMetadata: { kind: input.kind, issuerId: input.issuerId ?? null },
    });
    return mapOrg(o);
  }

  async inviteMember(
    orgId: string,
    invitedByUserId: string,
    input: InviteInput,
  ): Promise<Invite> {
    const cc = await clerkClient();
    const appRoles = Array.from(
      new Set<AppRole>([input.appRole, ...(input.appRoles ?? [])]),
    );
    try {
      const inv = await cc.organizations.createOrganizationInvitation({
        organizationId: orgId,
        inviterUserId: invitedByUserId,
        emailAddress: input.email,
        role: mapRoleToClerk(input.appRole),
        redirectUrl: input.redirectUrl,
        publicMetadata: { appRole: input.appRole, appRoles },
      });
      return mapInvite(inv);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Clerk returns 422 with "duplicate_record" when an active invite exists.
      if (/duplicate|already/i.test(msg)) throw inviteAlreadyExists(input.email);
      throw err;
    }
  }

  async revokeInvite(orgId: string, inviteId: string): Promise<void> {
    const cc = await clerkClient();
    try {
      await cc.organizations.revokeOrganizationInvitation({
        organizationId: orgId,
        invitationId: inviteId,
        // Clerk requires a requesting user id; we use the org's first admin
        // server-side. For simplicity we pass an empty string and rely on
        // the route handler to enforce auth (Clerk also accepts the call
        // when invoked with a backend secret).
        requestingUserId: "",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/not.found|404/i.test(msg)) throw inviteNotFound(inviteId);
      throw err;
    }
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
    if (appRoles.length === 0) {
      throw forbidden("At least one app role is required.");
    }
    const cc = await clerkClient();
    const org = await cc.organizations
      .getOrganization({ organizationId: orgId })
      .catch(() => null);
    if (!org) throw orgNotFound(orgId);
    const kind = mapKindFromMetadata(org.publicMetadata);
    // plane sanity: every role must belong to this org's plane.
    const wantsOps = kind === "ops";
    for (const r of appRoles) {
      const rIsOps = r.startsWith("ops_");
      if (rIsOps !== wantsOps) {
        throw forbidden(`Role "${r}" does not belong to a ${kind} workspace.`);
      }
    }
    const dedupedRoles = Array.from(new Set(appRoles));
    // Coarse Clerk role: admin if any granular role is admin-level.
    const coarse = dedupedRoles.some((r) => r.endsWith("_admin"))
      ? "org:admin"
      : "org:member";
    try {
      await cc.organizations.updateOrganizationMembership({
        organizationId: orgId,
        userId,
        role: coarse,
      });
      await cc.organizations
        .updateOrganizationMembershipMetadata({
          organizationId: orgId,
          userId,
          publicMetadata: { appRole: dedupedRoles[0], appRoles: dedupedRoles },
        })
        .catch(() => {
          // Older Clerk SDKs may not expose this method; the coarse
          // role update above is still applied. mapMember() will then
          // fall back to baseline derivation from the Clerk role.
        });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/not.found|404/i.test(msg)) throw membershipNotFound();
      throw err;
    }
    // Re-read to return the fresh OrgMember.
    const list = await cc.organizations.getOrganizationMembershipList({ organizationId: orgId });
    const found = list.data.find((m) => m.publicUserData?.userId === userId);
    if (!found) throw membershipNotFound();
    return mapMember(found, kind);
  }

  async removeMember(orgId: string, userId: string): Promise<void> {
    const cc = await clerkClient();
    try {
      await cc.organizations.deleteOrganizationMembership({
        organizationId: orgId,
        userId,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/not.found|404/i.test(msg)) throw membershipNotFound();
      throw err;
    }
  }
}

export const clerkOrganizationAdapter = new ClerkOrganizationAdapter();
