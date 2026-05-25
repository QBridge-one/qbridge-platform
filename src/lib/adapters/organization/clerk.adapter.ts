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
import type {
  IssuerKybDecisionInput,
  IssuerKybSubmitBody,
} from "../../core/issuer-kyb";
import {
  forbidden,
  inviteAlreadyExists,
  inviteNotFound,
  issuerKybConflict,
  membershipNotFound,
  orgNotFound,
} from "../../core/errors";
import { kybFieldsFromOrganizationPublicMeta } from "../clerk/issuer-metadata";
import { kybCaseFromMetadata } from "../../core/kyb-verification";
import {
  mapRoleFromClerk,
  mapRoleToClerk,
  readAppRolesFromMetadata,
} from "../identity/clerk.adapter";
import type { Address } from "../../core/types";

type ClerkClient = Awaited<ReturnType<typeof clerkClient>>;

/** Read primaryWallet from a Clerk user's publicMetadata. */
function pickPrimaryWalletFromMeta(meta: unknown): Address | null {
  if (meta && typeof meta === "object" && "primaryWallet" in meta) {
    const v = (meta as { primaryWallet?: unknown }).primaryWallet;
    if (typeof v === "string" && /^0x[a-fA-F0-9]{40}$/.test(v)) {
      return v as Address;
    }
  }
  return null;
}

/** Batch-fetch userIds → primaryWallet (linked via SIWE). Returns an
 *  empty Map when the input is empty. Tolerates partial failures by
 *  returning whatever Clerk gave us. */
async function fetchWalletMap(
  cc: ClerkClient,
  userIds: string[],
): Promise<Map<string, Address>> {
  const out = new Map<string, Address>();
  if (userIds.length === 0) return out;
  // De-dupe to keep the Clerk request small.
  const unique = Array.from(new Set(userIds));
  try {
    const list = await cc.users.getUserList({ userId: unique, limit: unique.length });
    for (const u of list.data) {
      const wallet = pickPrimaryWalletFromMeta(u.publicMetadata);
      if (wallet) out.set(u.id, wallet);
    }
  } catch {
    // Fall through with whatever's been resolved (none, in this case).
  }
  return out;
}

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
  const kyb = kybFieldsFromOrganizationPublicMeta(kind, o.publicMetadata);
  return {
    id: o.id,
    authOrgId: o.id,
    name: o.name,
    slug: o.slug ?? o.id,
    kind,
    issuerId: pickIssuerId(o.publicMetadata),
    kybStatus: kyb.kybStatus,
    kybApplication: kyb.kybApplication,
    kybReview: kyb.kybReview,
    kybCase: kybCaseFromMetadata(o.publicMetadata),
    createdAt: new Date(o.createdAt).toISOString(),
  };
}

function mapMember(
  m: ClerkMember,
  kind: OrgKind,
  walletByUserId?: ReadonlyMap<string, Address>,
): OrgMember {
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
    // Per-membership wallet is sourced from the USER's
    // publicMetadata.primaryWallet (set by the SIWE wallet-link flow).
    // Caller batch-resolves and passes the map; null when not linked.
    walletAddress: walletByUserId?.get(id) ?? null,
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

  async listOrgs(filter?: { kind?: OrgKind; limit?: number }): Promise<AppOrg[]> {
    const cc = await clerkClient();
    // Clerk caps `limit` at 500 per call. For v1 issuer counts we
    // stay under that; when we cross it we'll page here.
    const hardLimit = Math.min(filter?.limit ?? 500, 500);
    const list = await cc.organizations.getOrganizationList({
      limit: hardLimit,
      orderBy: "-created_at",
    });
    let mapped = list.data.map(mapOrg);
    if (filter?.kind) mapped = mapped.filter((o) => o.kind === filter.kind);
    if (filter?.limit != null) mapped = mapped.slice(0, filter.limit);
    return mapped;
  }

  async listMembers(orgId: string): Promise<OrgMember[]> {
    const cc = await clerkClient();
    const org = await cc.organizations.getOrganization({ organizationId: orgId }).catch(() => null);
    if (!org) throw orgNotFound(orgId);
    const kind = mapKindFromMetadata(org.publicMetadata);
    const list = await cc.organizations.getOrganizationMembershipList({ organizationId: orgId });
    const userIds = list.data
      .map((m) => m.publicUserData?.userId)
      .filter((u): u is string => typeof u === "string");
    const walletByUserId = await fetchWalletMap(cc, userIds);
    return list.data.map((m) => mapMember(m, kind, walletByUserId));
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
      publicMetadata:
        input.kind === "issuer"
          ? { kind: "issuer", issuerId: input.issuerId ?? null, kybStatus: "none" }
          : { kind: input.kind, issuerId: input.issuerId ?? null },
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

  async submitIssuerKyb(orgId: string, body: IssuerKybSubmitBody): Promise<AppOrg> {
    const cc = await clerkClient();
    const o = await cc.organizations.getOrganization({ organizationId: orgId }).catch(() => null);
    if (!o) throw orgNotFound(orgId);
    const kind = mapKindFromMetadata(o.publicMetadata);
    if (kind !== "issuer") {
      throw forbidden("Only issuer workspaces go through KYB onboarding.");
    }
    const existing =
      o.publicMetadata != null && typeof o.publicMetadata === "object"
        ? { ...(o.publicMetadata as Record<string, unknown>) }
        : {};
    const submittedAt = new Date().toISOString();
    const snapshot = {
      legalEntityName: body.legalEntityName,
      jurisdiction: body.jurisdiction,
      companyWebsite: body.companyWebsite ?? null,
      notes: body.notes ?? null,
      submittedAt,
    };
    await cc.organizations.updateOrganization(orgId, {
      publicMetadata: {
        ...existing,
        kind: "issuer",
        kybStatus: "submitted",
        kybApplication: snapshot,
        // Resubmission clears any prior decision; ops re-reviews from scratch.
        kybReview: null,
      },
    });
    const fresh = await cc.organizations.getOrganization({ organizationId: orgId });
    return mapOrg(fresh);
  }

  async setIssuerKybDecision(
    orgId: string,
    input: IssuerKybDecisionInput,
  ): Promise<AppOrg> {
    const cc = await clerkClient();
    const o = await cc.organizations
      .getOrganization({ organizationId: orgId })
      .catch(() => null);
    if (!o) throw orgNotFound(orgId);
    const kind = mapKindFromMetadata(o.publicMetadata);
    if (kind !== "issuer") {
      throw forbidden("Only issuer workspaces have KYB decisions.");
    }
    const kybNow = kybFieldsFromOrganizationPublicMeta(kind, o.publicMetadata);
    if (kybNow.kybStatus !== "submitted") {
      throw issuerKybConflict();
    }
    const existing =
      o.publicMetadata != null && typeof o.publicMetadata === "object"
        ? { ...(o.publicMetadata as Record<string, unknown>) }
        : {};
    const review = {
      decision: input.decision,
      decidedByUserId: input.decidedByUserId,
      decidedAt: new Date().toISOString(),
      reason: input.reason ?? null,
    };
    await cc.organizations.updateOrganization(orgId, {
      publicMetadata: {
        ...existing,
        kind: "issuer",
        kybStatus: input.decision,
        kybReview: review,
      },
    });
    const fresh = await cc.organizations.getOrganization({ organizationId: orgId });
    return mapOrg(fresh);
  }

  async updateOrgMetadata(
    orgId: string,
    partial: Record<string, unknown>,
  ): Promise<AppOrg> {
    const cc = await clerkClient();
    const o = await cc.organizations.getOrganization({ organizationId: orgId }).catch(() => null);
    if (!o) throw orgNotFound(orgId);
    const existing =
      o.publicMetadata != null && typeof o.publicMetadata === "object"
        ? { ...(o.publicMetadata as Record<string, unknown>) }
        : {};
    await cc.organizations.updateOrganization(orgId, {
      publicMetadata: { ...existing, ...partial },
    });
    const fresh = await cc.organizations.getOrganization({ organizationId: orgId });
    return mapOrg(fresh);
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
    // Re-read to return the fresh OrgMember (with wallet resolved).
    const list = await cc.organizations.getOrganizationMembershipList({ organizationId: orgId });
    const found = list.data.find((m) => m.publicUserData?.userId === userId);
    if (!found) throw membershipNotFound();
    const walletByUserId = await fetchWalletMap(cc, [userId]);
    return mapMember(found, kind, walletByUserId);
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
