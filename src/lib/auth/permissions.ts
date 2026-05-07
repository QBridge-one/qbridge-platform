// ============================================================
// lib/auth/permissions.ts
// Off-chain RBAC. Pure code — vendor-agnostic. Drives UI/API gates.
// On-chain authority is enforced separately by AccessManager contracts.
// ============================================================

import type { AppRole, OrgKind } from "../core/identity.types";

/**
 * Permission keys are namespaced "<domain>:<action>".
 * Add new ones here; never inline string literals at call sites.
 */
export type Permission =
  // Workspace (issuer)
  | "workspace:view"
  | "workspace:settings:view"
  | "workspace:team:view"
  | "workspace:team:invite"
  | "workspace:team:remove"
  | "workspace:team:change_role"
  | "workspace:assets:create"
  | "workspace:assets:edit"
  | "workspace:cap_table:view"
  // Ops (platform)
  | "ops:view"
  | "ops:settings:view"
  | "ops:team:view"
  | "ops:team:invite"
  | "ops:team:remove"
  | "ops:team:change_role"
  | "ops:issuers:approve"
  | "ops:flags:edit";

const POLICY: Record<AppRole, ReadonlySet<Permission>> = {
  ops_admin: new Set<Permission>([
    "ops:view",
    "ops:settings:view",
    "ops:team:view",
    "ops:team:invite",
    "ops:team:remove",
    "ops:team:change_role",
    "ops:issuers:approve",
    "ops:flags:edit",
  ]),
  ops_member: new Set<Permission>([
    "ops:view",
    "ops:settings:view",
    "ops:team:view",
    "ops:issuers:approve",
  ]),
  issuer_admin: new Set<Permission>([
    "workspace:view",
    "workspace:settings:view",
    "workspace:team:view",
    "workspace:team:invite",
    "workspace:team:remove",
    "workspace:team:change_role",
    "workspace:assets:create",
    "workspace:assets:edit",
    "workspace:cap_table:view",
  ]),
  issuer_member: new Set<Permission>([
    "workspace:view",
    "workspace:settings:view",
    "workspace:team:view",
    "workspace:cap_table:view",
  ]),
};

export function can(appRole: AppRole | null, perm: Permission): boolean {
  if (!appRole) return false;
  return POLICY[appRole].has(perm);
}

/** Plane that a permission belongs to — useful for routing checks. */
export function planeOf(perm: Permission): OrgKind {
  return perm.startsWith("ops:") ? "ops" : "issuer";
}

/** Higher-level helper: does this role match the plane? */
export function roleMatchesPlane(appRole: AppRole, kind: OrgKind): boolean {
  if (kind === "ops") return appRole === "ops_admin" || appRole === "ops_member";
  return appRole === "issuer_admin" || appRole === "issuer_member";
}
