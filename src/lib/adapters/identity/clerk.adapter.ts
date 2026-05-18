// ============================================================
// lib/adapters/identity/clerk.adapter.ts
// Clerk implementation of IdentityPort.
// Activated when IDENTITY_PROVIDER=clerk.
// ============================================================

import "server-only";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import type { IdentityPort } from "../../ports/identity.port";
import type { AppOrg, AppRole, AppSession, AppUser } from "../../core/identity.types";
import { kybFieldsFromOrganizationPublicMeta } from "../clerk/issuer-metadata";
import { isAppRole } from "../../core/identity.types";
import { unauthenticated } from "../../core/errors";

/** Read kind from a Clerk org's publicMetadata. Default: "issuer". */
function mapKindFromMetadata(meta: unknown): "ops" | "issuer" {
  if (meta && typeof meta === "object" && "kind" in meta && (meta as { kind?: unknown }).kind === "ops") {
    return "ops";
  }
  return "issuer";
}

function pickIssuerId(meta: unknown): string | null {
  if (meta && typeof meta === "object" && "issuerId" in meta) {
    const v = (meta as { issuerId?: unknown }).issuerId;
    if (typeof v === "string") return v;
  }
  return null;
}

function pickPrimaryWallet(meta: unknown): `0x${string}` | null {
  if (meta && typeof meta === "object" && "primaryWallet" in meta) {
    const v = (meta as { primaryWallet?: unknown }).primaryWallet;
    if (typeof v === "string" && /^0x[a-fA-F0-9]{40}$/.test(v)) return v as `0x${string}`;
  }
  return null;
}

/** Maps Clerk membership role string ("org:admin", "org:member", or custom)
 *  to a baseline AppRole, plane-aware. This is the FALLBACK only — when
 *  membership.publicMetadata.appRoles isn't set, we derive the baseline
 *  from Clerk's coarse role. */
export function mapRoleFromClerk(
  clerkRole: string,
  kind: "ops" | "issuer",
): AppRole {
  if (clerkRole === "org:admin") return kind === "ops" ? "ops_admin" : "issuer_admin";
  if (clerkRole === "org:member") return kind === "ops" ? "ops_member" : "issuer_member";
  // Custom Clerk roles can encode an AppRole in the suffix.
  const m = /:([a-z_]+)$/.exec(clerkRole);
  if (m && isAppRole(m[1])) return m[1];
  return kind === "ops" ? "ops_member" : "issuer_member";
}

/** Inverse mapping for invites — what coarse string we send to Clerk.
 *  Clerk only knows org:admin / org:member; the granular AppRole is
 *  carried separately in publicMetadata.appRoles. */
export function mapRoleToClerk(role: AppRole): string {
  if (role === "ops_admin" || role === "issuer_admin") return "org:admin";
  return "org:member";
}

/** Read the granular `appRoles` array from a Clerk membership/invite
 *  publicMetadata. Falls back to legacy single `appRole`. Returns null
 *  when metadata is missing or invalid — caller derives the baseline. */
export function readAppRolesFromMetadata(meta: unknown): AppRole[] | null {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as Record<string, unknown>;
  if (Array.isArray(m.appRoles)) {
    const valid = m.appRoles.filter(isAppRole);
    if (valid.length > 0) return Array.from(new Set(valid));
  }
  if (isAppRole(m.appRole)) return [m.appRole];
  return null;
}

class ClerkIdentityAdapter implements IdentityPort {
  async getSession(): Promise<AppSession | null> {
    const a = await auth();
    if (!a.userId) return null;
    const u = await currentUser();
    if (!u) return null;
    const user: AppUser = {
      id: u.id,
      authUserId: u.id,
      email: u.primaryEmailAddress?.emailAddress ?? u.emailAddresses[0]?.emailAddress ?? "",
      displayName: [u.firstName, u.lastName].filter(Boolean).join(" ") || null,
      imageUrl: u.imageUrl ?? null,
      primaryWallet: pickPrimaryWallet(u.publicMetadata),
      createdAt: new Date(u.createdAt).toISOString(),
    };
    let activeOrg: AppOrg | null = null;
    let appRoles: AppRole[] = [];
    if (a.orgId) {
      const cc = await clerkClient();
      const o = await cc.organizations.getOrganization({ organizationId: a.orgId });
      const kind = mapKindFromMetadata(o.publicMetadata);
      const kyb = kybFieldsFromOrganizationPublicMeta(kind, o.publicMetadata);
      activeOrg = {
        id: o.id,
        authOrgId: o.id,
        name: o.name,
        slug: o.slug ?? o.id,
        kind,
        issuerId: pickIssuerId(o.publicMetadata),
        kybStatus: kyb.kybStatus,
        kybApplication: kyb.kybApplication,
        createdAt: new Date(o.createdAt).toISOString(),
      };
      // Prefer granular appRoles from membership metadata. Look up the
      // user's membership for this org so we can read its publicMetadata.
      const memberships = await cc.users.getOrganizationMembershipList({ userId: u.id });
      const membership = memberships.data.find((m) => m.organization.id === a.orgId);
      const fromMeta = readAppRolesFromMetadata(membership?.publicMetadata);
      if (fromMeta && fromMeta.length > 0) {
        appRoles = fromMeta;
      } else if (a.orgRole) {
        appRoles = [mapRoleFromClerk(a.orgRole, kind)];
      }
    }
    const appRole = appRoles[0] ?? null;
    return { user, activeOrg, appRoles, appRole };
  }

  async requireSession(): Promise<AppSession> {
    const s = await this.getSession();
    if (!s) throw unauthenticated();
    return s;
  }

  async getUser(userId: string): Promise<AppUser | null> {
    const cc = await clerkClient();
    try {
      const u = await cc.users.getUser(userId);
      return {
        id: u.id,
        authUserId: u.id,
        email: u.primaryEmailAddress?.emailAddress ?? u.emailAddresses[0]?.emailAddress ?? "",
        displayName: [u.firstName, u.lastName].filter(Boolean).join(" ") || null,
        imageUrl: u.imageUrl ?? null,
        primaryWallet: pickPrimaryWallet(u.publicMetadata),
        createdAt: new Date(u.createdAt).toISOString(),
      };
    } catch {
      return null;
    }
  }

  async signOut(): Promise<void> {
    // Server-side: client triggers via <SignOutButton/> or signOut() from useClerk.
  }
}

export const clerkIdentityAdapter = new ClerkIdentityAdapter();
