// ============================================================
// lib/auth/permissions.ts
// Off-chain RBAC. Pure code — vendor-agnostic. Drives UI/API gates.
// On-chain authority is enforced separately by AccessManager contracts.
//
// A user can hold MULTIPLE AppRoles per org (OrgMember.appRoles).
// `can(roles, perm)` is the union of each role's permission set.
// ============================================================

import type { AppRole, OrgKind } from "../core/identity.types";

/**
 * Permission keys are namespaced "<plane>:<domain>:<action>".
 * Add new ones here; never inline string literals at call sites.
 */
export type Permission =
  // ── Workspace (issuer plane) — generic ──
  | "workspace:view"
  | "workspace:settings:view"
  | "workspace:team:view"
  | "workspace:team:invite"
  | "workspace:team:remove"
  | "workspace:team:change_role"
  // ── Workspace — assets / property ──
  | "workspace:assets:create"
  | "workspace:assets:edit"
  | "workspace:asset:update"
  // ── Workspace — cap table / investors ──
  | "workspace:cap_table:view"
  | "workspace:cap_table:export"
  | "workspace:investors:onboard"
  | "workspace:investors:approve"
  | "workspace:investors:freeze"
  | "workspace:kyc:review"
  // ── Workspace — offerings / distributions / reporting ──
  | "workspace:offerings:create"
  | "workspace:offerings:approve"
  | "workspace:offerings:close"
  | "workspace:distributions:propose"
  | "workspace:distributions:execute"
  | "workspace:reports:export"
  | "workspace:reports:f45_106f1"
  | "workspace:secondary:approve_trade"
  // ── Ops (platform plane) — generic ──
  | "ops:view"
  | "ops:settings:view"
  | "ops:team:view"
  | "ops:team:invite"
  | "ops:team:remove"
  | "ops:team:change_role"
  // ── Ops — issuer / investor lifecycle ──
  | "ops:issuers:approve"
  | "ops:issuers:kyb_review"
  | "ops:issuers:suspend"
  | "ops:investors:freeze_global"
  | "ops:flags:edit"
  // ── Ops — platform engineering / audit / support ──
  | "ops:contracts:deploy"
  | "ops:audit:export"
  | "ops:support:investor_view"
  | "ops:support:issuer_view";

const POLICY: Record<AppRole, ReadonlySet<Permission>> = {
  // ── Issuer plane ─────────────────────────────────────────
  issuer_admin: new Set<Permission>([
    "workspace:view",
    "workspace:settings:view",
    "workspace:team:view",
    "workspace:team:invite",
    "workspace:team:remove",
    "workspace:team:change_role",
    "workspace:assets:create",
    "workspace:assets:edit",
    "workspace:asset:update",
    "workspace:cap_table:view",
    "workspace:cap_table:export",
    "workspace:investors:onboard",
    "workspace:investors:approve",
    "workspace:investors:freeze",
    "workspace:kyc:review",
    "workspace:offerings:create",
    "workspace:offerings:approve",
    "workspace:offerings:close",
    "workspace:distributions:propose",
    "workspace:distributions:execute",
    "workspace:reports:export",
    "workspace:reports:f45_106f1",
    "workspace:secondary:approve_trade",
  ]),
  issuer_compliance: new Set<Permission>([
    "workspace:view",
    "workspace:settings:view",
    "workspace:team:view",
    "workspace:cap_table:view",
    "workspace:cap_table:export",
    "workspace:investors:approve",
    "workspace:investors:freeze",
    "workspace:kyc:review",
    "workspace:offerings:approve",
    "workspace:distributions:execute",
    "workspace:reports:export",
    "workspace:reports:f45_106f1",
    "workspace:secondary:approve_trade",
  ]),
  issuer_dealer: new Set<Permission>([
    "workspace:view",
    "workspace:team:view",
    "workspace:cap_table:view",
    "workspace:investors:onboard",
    "workspace:reports:export",
  ]),
  issuer_operations: new Set<Permission>([
    "workspace:view",
    "workspace:settings:view",
    "workspace:team:view",
    "workspace:cap_table:view",
    "workspace:cap_table:export",
    "workspace:offerings:create",
    "workspace:offerings:close",
    "workspace:distributions:propose",
    "workspace:reports:export",
  ]),
  issuer_property_manager: new Set<Permission>([
    "workspace:view",
    "workspace:cap_table:view",
    "workspace:assets:edit",
    "workspace:asset:update",
  ]),
  issuer_auditor: new Set<Permission>([
    "workspace:view",
    "workspace:cap_table:view",
    "workspace:cap_table:export",
    "workspace:reports:export",
    "workspace:reports:f45_106f1",
  ]),
  issuer_member: new Set<Permission>([
    "workspace:view",
    "workspace:settings:view",
    "workspace:team:view",
    "workspace:cap_table:view",
  ]),

  // ── Ops plane ────────────────────────────────────────────
  ops_admin: new Set<Permission>([
    "ops:view",
    "ops:settings:view",
    "ops:team:view",
    "ops:team:invite",
    "ops:team:remove",
    "ops:team:change_role",
    "ops:issuers:approve",
    "ops:issuers:kyb_review",
    "ops:issuers:suspend",
    "ops:investors:freeze_global",
    "ops:flags:edit",
    "ops:contracts:deploy",
    "ops:audit:export",
    "ops:support:investor_view",
    "ops:support:issuer_view",
  ]),
  ops_compliance: new Set<Permission>([
    "ops:view",
    "ops:settings:view",
    "ops:team:view",
    "ops:issuers:approve",
    "ops:issuers:suspend",
    "ops:investors:freeze_global",
    "ops:flags:edit",
    "ops:audit:export",
    "ops:support:issuer_view",
  ]),
  ops_onboarding: new Set<Permission>([
    "ops:view",
    "ops:team:view",
    "ops:issuers:kyb_review",
    "ops:support:issuer_view",
  ]),
  ops_support: new Set<Permission>([
    "ops:view",
    "ops:team:view",
    "ops:support:investor_view",
    "ops:support:issuer_view",
  ]),
  ops_engineer: new Set<Permission>([
    "ops:view",
    "ops:settings:view",
    "ops:flags:edit",
    "ops:contracts:deploy",
    "ops:audit:export",
  ]),
  ops_member: new Set<Permission>([
    "ops:view",
    "ops:settings:view",
    "ops:team:view",
  ]),
};

/** Accepts a single role, an array of roles, or null. Returns true if
 *  ANY of the roles grants the permission (set-union semantics). */
export function can(
  roles: AppRole | readonly AppRole[] | null | undefined,
  perm: Permission,
): boolean {
  if (!roles) return false;
  if (Array.isArray(roles)) {
    for (const r of roles as readonly AppRole[]) {
      if (POLICY[r]?.has(perm)) return true;
    }
    return false;
  }
  return POLICY[roles as AppRole]?.has(perm) ?? false;
}

/** Plane that a permission belongs to — useful for routing checks. */
export function planeOf(perm: Permission): OrgKind {
  return perm.startsWith("ops:") ? "ops" : "issuer";
}

/** True if at least one role belongs to the given plane. */
export function roleMatchesPlane(
  roles: AppRole | readonly AppRole[] | null | undefined,
  kind: OrgKind,
): boolean {
  if (!roles) return false;
  const list = Array.isArray(roles) ? roles : [roles as AppRole];
  return list.some((r) =>
    kind === "ops" ? r.startsWith("ops_") : r.startsWith("issuer_"),
  );
}
