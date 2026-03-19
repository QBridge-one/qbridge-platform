// ============================================================
// types/roles.ts
// Role definitions for the two-tier RBAC system
// Matches OpenZeppelin AccessManagerUpgradeable role IDs
// ============================================================

// ─── Platform-Level Roles ────────────────────────────────────
// Managed by PlatformAccessManager (your team)
// Controls: issuer approval, compliance infra, emergency ops

export const PLATFORM_ROLES = {
  /** Full platform control — can do everything */
  ADMIN: BigInt(0), // OZ reserves 0 as ADMIN_ROLE
  /** Review assets, manage IComplianceChecker addresses */
  COMPLIANCE: BigInt(1),
  /** Day-to-day ops, KYB review, issuer onboarding */
  OPERATOR: BigInt(2),
  /** Read-only access for audits and reports */
  AUDITOR: BigInt(3),
} as const;

export type PlatformRole = keyof typeof PLATFORM_ROLES;

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  ADMIN: "Platform Admin",
  COMPLIANCE: "Platform Compliance",
  OPERATOR: "Platform Operator",
  AUDITOR: "Platform Auditor",
};

export const PLATFORM_ROLE_DESCRIPTIONS: Record<PlatformRole, string> = {
  ADMIN:
    "Full platform control — approve issuers, manage platform contracts, emergency controls",
  COMPLIANCE:
    "Review and approve asset listings, manage compliance checker contracts",
  OPERATOR:
    "Issuer KYB review, onboarding support, day-to-day platform operations",
  AUDITOR: "Read-only access to all platform data, reports, and audit trails",
};

// ─── Token-Level Roles ───────────────────────────────────────
// Managed by TokenAccessManager (per issued token)
// Controls: mint, burn, freeze, pause, force ops
// The issuer receives ADMIN_ROLE (id 0) at token creation

export const TOKEN_ROLES = {
  /** Full token control — issuer gets this at deployment (OZ id 0) */
  ADMIN: BigInt(0),
  /** Can call mint() on the token contract */
  MINTER: BigInt(10),
  /** Can freeze/unfreeze accounts, setFrozenBalance */
  COMPLIANCE: BigInt(11),
  /** Can forceTransfer / forceBurn for regulatory recovery */
  ENFORCER: BigInt(12),
  /** Can pause/unpause regular operations */
  PAUSER: BigInt(13),
  /** Read-only access to token state */
  AUDITOR: BigInt(14),
} as const;

export type TokenRole = keyof typeof TOKEN_ROLES;

export const TOKEN_ROLE_LABELS: Record<TokenRole, string> = {
  ADMIN: "Token Admin",
  MINTER: "Minter",
  COMPLIANCE: "Compliance Officer",
  ENFORCER: "Compliance Enforcer",
  PAUSER: "Pauser",
  AUDITOR: "Token Auditor",
};

export const TOKEN_ROLE_DESCRIPTIONS: Record<TokenRole, string> = {
  ADMIN:
    "Full token control — assign roles, configure, and manage the token contract",
  MINTER: "Can mint new tokens to any address within compliance rules",
  COMPLIANCE:
    "Can freeze/unfreeze accounts and manage partial frozen balances",
  ENFORCER:
    "Can force transfer or force burn tokens for regulatory compliance",
  PAUSER: "Can pause and unpause regular token operations",
  AUDITOR: "Read-only access to token data, events, and balances",
};

// ─── Combined role type for UI ────────────────────────────────
export type RoleScope = "PLATFORM" | "TOKEN";

export interface RoleDefinition {
  id: bigint;
  key: string;
  label: string;
  description: string;
  scope: RoleScope;
  sensitive?: boolean; // warn before assigning
}

export const ALL_PLATFORM_ROLES: RoleDefinition[] = Object.entries(
  PLATFORM_ROLES
).map(([key, id]) => ({
  id,
  key,
  label: PLATFORM_ROLE_LABELS[key as PlatformRole],
  description: PLATFORM_ROLE_DESCRIPTIONS[key as PlatformRole],
  scope: "PLATFORM",
  sensitive: key === "ADMIN" || key === "COMPLIANCE",
}));

export const ALL_TOKEN_ROLES: RoleDefinition[] = Object.entries(
  TOKEN_ROLES
).map(([key, id]) => ({
  id,
  key,
  label: TOKEN_ROLE_LABELS[key as TokenRole],
  description: TOKEN_ROLE_DESCRIPTIONS[key as TokenRole],
  scope: "TOKEN",
  sensitive: key === "ADMIN" || key === "ENFORCER",
}));

// ─── Session user type (from NextAuth + Web3Auth) ─────────────
export interface SessionUser {
  address: string; // wallet address from Web3Auth
  email?: string;
  name?: string;
  platformRole: PlatformRole | null; // null = no platform access
  issuerId?: string; // set if user is an issuer
}
