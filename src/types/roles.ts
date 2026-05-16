// ============================================================
// types/roles.ts
// Labels, descriptions and UI helpers for AccessManager roles.
// IDs live in src/lib/contracts/roles.ts — DO NOT duplicate here.
// ============================================================

import { PLATFORM_ROLES, TOKEN_ROLES } from "@/lib/contracts/roles";

export { PLATFORM_ROLES, TOKEN_ROLES };

// ─── Platform-Level Roles ────────────────────────────────────
// Managed by PlatformAccessManager (QBridge governance).

export type PlatformRole = Exclude<keyof typeof PLATFORM_ROLES, "PUBLIC">;

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  SUPER_ADMIN: "Super Admin",
  PLATFORM_ADMIN: "Platform Admin",
  COMPLIANCE: "Platform Compliance",
  OPERATOR: "Platform Operator",
  AUDITOR: "Platform Auditor",
};

export const PLATFORM_ROLE_DESCRIPTIONS: Record<PlatformRole, string> = {
  SUPER_ADMIN:
    "OZ ADMIN_ROLE — deploys/upgrades the AccessManager, labels roles, sets function gates. Reserved for governance.",
  PLATFORM_ADMIN:
    "Grants and revokes platform functional roles (compliance / operator / auditor). Day-to-day QBridge admin.",
  COMPLIANCE:
    "Review and approve asset listings, manage compliance checker contracts.",
  OPERATOR:
    "Issuer KYB review, onboarding support, day-to-day platform operations.",
  AUDITOR: "Read-only access to platform audit views and on-chain logs.",
};

// ─── Token-Level Roles ───────────────────────────────────────
// Managed by TokenAccessManager (one per issued token).

export type TokenRole = Exclude<keyof typeof TOKEN_ROLES, "PUBLIC">;

export const TOKEN_ROLE_LABELS: Record<TokenRole, string> = {
  SUPER_ADMIN: "Super Admin",
  TOKEN_ADMIN: "Token Admin",
  MINTER: "Minter",
  COMPLIANCE: "Compliance Officer",
  ENFORCER: "Compliance Enforcer",
  PAUSER: "Pauser",
  AUDITOR: "Token Auditor",
};

export const TOKEN_ROLE_DESCRIPTIONS: Record<TokenRole, string> = {
  SUPER_ADMIN:
    "OZ ADMIN_ROLE — deploys/upgrades this token's AccessManager. Reserved for factory / governance.",
  TOKEN_ADMIN:
    "Grants and revokes token functional roles (minter / compliance / etc). Issuer admin for this token.",
  MINTER: "Can mint new tokens to any address within compliance rules.",
  COMPLIANCE:
    "Can freeze/unfreeze accounts and manage partial frozen balances.",
  ENFORCER:
    "Can force transfer or force burn tokens for regulatory compliance.",
  PAUSER: "Can pause and unpause regular token operations.",
  AUDITOR: "Read-only access to token data, events, and balances.",
};

// ─── Combined role type for UI ────────────────────────────────
export type RoleScope = "PLATFORM" | "TOKEN";

export interface RoleDefinition {
  id: bigint;
  key: string;
  label: string;
  description: string;
  scope: RoleScope;
  /** Warn before assigning — true for super/admin tiers and enforcement. */
  sensitive?: boolean;
}

const SENSITIVE_KEYS = new Set([
  "SUPER_ADMIN",
  "PLATFORM_ADMIN",
  "TOKEN_ADMIN",
  "ENFORCER",
]);

export const ALL_PLATFORM_ROLES: RoleDefinition[] = (
  Object.keys(PLATFORM_ROLE_LABELS) as PlatformRole[]
).map((key) => ({
  id: PLATFORM_ROLES[key],
  key,
  label: PLATFORM_ROLE_LABELS[key],
  description: PLATFORM_ROLE_DESCRIPTIONS[key],
  scope: "PLATFORM",
  sensitive: SENSITIVE_KEYS.has(key),
}));

export const ALL_TOKEN_ROLES: RoleDefinition[] = (
  Object.keys(TOKEN_ROLE_LABELS) as TokenRole[]
).map((key) => ({
  id: TOKEN_ROLES[key],
  key,
  label: TOKEN_ROLE_LABELS[key],
  description: TOKEN_ROLE_DESCRIPTIONS[key],
  scope: "TOKEN",
  sensitive: SENSITIVE_KEYS.has(key),
}));

// ─── Session user type (from NextAuth + Web3Auth) ─────────────
export interface SessionUser {
  address: string;
  email?: string;
  name?: string;
  /** null = no platform access */
  platformRole: PlatformRole | null;
  issuerId?: string;
}
