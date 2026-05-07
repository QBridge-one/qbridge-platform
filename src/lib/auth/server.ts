// ============================================================
// lib/auth/server.ts
// Server-only authorization helpers. Use in route handlers and
// server components. NEVER call from client code.
//
//   const session = await requireSession()
//   await requireOrg("issuer")            // ensures activeOrg.kind matches
//   await requirePermission("workspace:team:invite")
// ============================================================

import "server-only";

import { identityAdapter } from "../container.server";
import type { AppSession, OrgKind } from "../core/identity.types";
import { forbidden, unauthenticated } from "../core/errors";
import { can, type Permission, roleMatchesPlane } from "./permissions";

export async function getSession(): Promise<AppSession | null> {
  return identityAdapter.getSession();
}

export async function requireSession(): Promise<AppSession> {
  const s = await identityAdapter.getSession();
  if (!s) throw unauthenticated();
  return s;
}

export async function requireOrg(kind?: OrgKind): Promise<AppSession & { activeOrg: NonNullable<AppSession["activeOrg"]> }> {
  const s = await requireSession();
  if (!s.activeOrg) throw forbidden("No active organization in session.");
  if (kind && s.activeOrg.kind !== kind) {
    throw forbidden(`Active organization is not a ${kind} workspace.`);
  }
  if (s.appRole && !roleMatchesPlane(s.appRole, s.activeOrg.kind)) {
    throw forbidden("Role/plane mismatch.");
  }
  return s as AppSession & { activeOrg: NonNullable<AppSession["activeOrg"]> };
}

export async function requirePermission(
  perm: Permission,
): Promise<AppSession & { activeOrg: NonNullable<AppSession["activeOrg"]> }> {
  const s = await requireOrg();
  if (!can(s.appRole, perm)) throw forbidden(`Missing permission: ${perm}`);
  return s;
}
