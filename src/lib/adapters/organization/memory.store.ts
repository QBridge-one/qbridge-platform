// ============================================================
// lib/adapters/organization/memory.store.ts
// Process-local store backing both memory identity & organization
// adapters. Lets dev mode have realistic invite / membership flows
// without a database. Replace with Postgres in production.
// ============================================================

import type {
  AppOrg,
  AppRole,
  AppUser,
  Invite,
  InviteInput,
  OrgKind,
  OrgMember,
} from "../../core/identity.types";

let _id = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${(_id++).toString(36)}`;

class MemoryOrganizationStore {
  private users = new Map<string, AppUser>();
  private orgs = new Map<string, AppOrg>();
  private members = new Map<string, OrgMember[]>(); // key = orgId
  private invites = new Map<string, Invite[]>();    // key = orgId

  // ── Users ────────────────────────────────────────────────
  upsertUser(user: AppUser): AppUser {
    this.users.set(user.id, user);
    return user;
  }

  getUser(userId: string): AppUser | null {
    return this.users.get(userId) ?? null;
  }

  setPrimaryWallet(userId: string, address: AppUser["primaryWallet"]): void {
    const u = this.users.get(userId);
    if (!u) return;
    this.users.set(userId, { ...u, primaryWallet: address });
  }

  // ── Orgs ─────────────────────────────────────────────────
  createOrg(input: {
    name: string;
    slug?: string;
    kind: OrgKind;
    issuerId?: string | null;
    creatorUserId: string;
  }): AppOrg {
    const id = nextId("org");
    const org: AppOrg = {
      id,
      authOrgId: `memory:${id}`,
      name: input.name,
      slug: input.slug ?? input.name.toLowerCase().replace(/\s+/g, "-"),
      kind: input.kind,
      issuerId: input.issuerId ?? null,
      createdAt: new Date().toISOString(),
    };
    this.orgs.set(id, org);
    this.members.set(id, []);
    this.invites.set(id, []);
    // creator becomes admin of the corresponding plane
    const adminRole: AppRole = input.kind === "ops" ? "ops_admin" : "issuer_admin";
    this.upsertMember(id, input.creatorUserId, adminRole, "active");
    return org;
  }

  getOrg(orgId: string): AppOrg | null {
    return this.orgs.get(orgId) ?? null;
  }

  listOrgs(): AppOrg[] {
    return [...this.orgs.values()];
  }

  listForUser(userId: string): AppOrg[] {
    const out: AppOrg[] = [];
    for (const [orgId, members] of this.members.entries()) {
      if (members.some((m) => m.userId === userId && m.status !== "suspended")) {
        const org = this.orgs.get(orgId);
        if (org) out.push(org);
      }
    }
    return out;
  }

  // ── Members ──────────────────────────────────────────────
  listMembers(orgId: string): OrgMember[] {
    return [...(this.members.get(orgId) ?? [])];
  }

  rolesOf(orgId: string, userId: string): AppRole[] | null {
    const m = this.members.get(orgId)?.find((mm) => mm.userId === userId);
    return m ? [...m.appRoles] : null;
  }

  /** @deprecated Use rolesOf(). Kept for legacy call sites. */
  roleOf(orgId: string, userId: string): AppRole | null {
    return this.rolesOf(orgId, userId)?.[0] ?? null;
  }

  upsertMember(
    orgId: string,
    userId: string,
    appRoles: AppRole | AppRole[],
    status: OrgMember["status"],
  ): OrgMember {
    const roles = Array.from(
      new Set<AppRole>(Array.isArray(appRoles) ? appRoles : [appRoles]),
    );
    if (roles.length === 0) {
      throw new Error("upsertMember requires at least one AppRole");
    }
    const arr = this.members.get(orgId) ?? [];
    const user = this.users.get(userId);
    const existing = arr.find((m) => m.userId === userId);
    if (existing) {
      existing.appRoles = roles;
      existing.appRole = roles[0];
      existing.status = status;
      existing.lastActiveAt = new Date().toISOString();
      return existing;
    }
    const member: OrgMember = {
      userId,
      orgId,
      email: user?.email ?? "",
      displayName: user?.displayName ?? null,
      imageUrl: user?.imageUrl ?? null,
      appRoles: roles,
      appRole: roles[0],
      status,
      walletAddress: user?.primaryWallet ?? null,
      joinedAt: new Date().toISOString(),
      lastActiveAt: status === "active" ? new Date().toISOString() : null,
    };
    arr.push(member);
    this.members.set(orgId, arr);
    return member;
  }

  removeMember(orgId: string, userId: string): void {
    const arr = (this.members.get(orgId) ?? []).filter((m) => m.userId !== userId);
    this.members.set(orgId, arr);
  }

  // ── Invites ──────────────────────────────────────────────
  listInvites(orgId: string): Invite[] {
    return [...(this.invites.get(orgId) ?? [])];
  }

  createInvite(orgId: string, invitedByUserId: string, input: InviteInput): Invite {
    const arr = this.invites.get(orgId) ?? [];
    const appRoles = Array.from(
      new Set<AppRole>([input.appRole, ...(input.appRoles ?? [])]),
    );
    const invite: Invite = {
      id: nextId("inv"),
      orgId,
      email: input.email.toLowerCase(),
      appRole: input.appRole,
      appRoles,
      status: "pending",
      invitedBy: invitedByUserId,
      createdAt: new Date().toISOString(),
      acceptedAt: null,
    };
    arr.push(invite);
    this.invites.set(orgId, arr);
    return invite;
  }

  setInviteStatus(orgId: string, inviteId: string, status: Invite["status"]): Invite | null {
    const arr = this.invites.get(orgId) ?? [];
    const inv = arr.find((i) => i.id === inviteId);
    if (!inv) return null;
    inv.status = status;
    if (status === "accepted") inv.acceptedAt = new Date().toISOString();
    return inv;
  }

  findPendingInvite(orgId: string, email: string): Invite | null {
    const lower = email.toLowerCase();
    return (
      this.invites.get(orgId)?.find(
        (i) => i.email === lower && i.status === "pending",
      ) ?? null
    );
  }
}

export const memoryOrganizationStore = new MemoryOrganizationStore();

// Seed a default ops org + an issuer org so the dev session has
// something to look at. Idempotent across HMR.
declare global {
  var __qbridgeMemoryStoreSeeded: boolean | undefined;
}

if (!globalThis.__qbridgeMemoryStoreSeeded) {
  globalThis.__qbridgeMemoryStoreSeeded = true;
  memoryOrganizationStore.upsertUser({
    id: "user_dev_root",
    authUserId: "memory:user_dev_root",
    email: "dev@qbridge.local",
    displayName: "QBridge Dev",
    imageUrl: null,
    primaryWallet: null,
    createdAt: new Date(0).toISOString(),
  });
  memoryOrganizationStore.createOrg({
    name: "QBridge Ops",
    slug: "qbridge-ops",
    kind: "ops",
    creatorUserId: "user_dev_root",
  });
  memoryOrganizationStore.createOrg({
    name: "Demo Issuer",
    slug: "demo-issuer",
    kind: "issuer",
    creatorUserId: "user_dev_root",
  });
}
