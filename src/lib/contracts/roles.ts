// ============================================================
// lib/contracts/roles.ts
//
// Single source of truth for AccessManager role IDs.
// Role IDs are uint64 in Solidity → bigint in TypeScript.
// NEVER use plain numbers — always use these constants.
//
// Three-tier model on each AccessManager:
//   tier 0  SUPER_ADMIN  — OZ ADMIN_ROLE (deployer / governance)
//   tier 1  *_ADMIN      — app-level admin (grants functional roles)
//   tier 2+ functional   — operational roles (compliance, minter, ...)
//
// Contracts must call setRoleAdmin so functional roles are admin-ed by
// the tier-1 admin (PLATFORM_ADMIN / TOKEN_ADMIN), not by SUPER_ADMIN.
// ============================================================

// ─── Platform AccessManager roles ────────────────────────────
export const PLATFORM_ROLES = {
  SUPER_ADMIN:    BigInt(0),  // OZ ADMIN_ROLE — deployer / governance
  PLATFORM_ADMIN: BigInt(1),  // QBridge ops admin
  COMPLIANCE:     BigInt(2),  // QBridge compliance team
  OPERATOR:       BigInt(3),  // QBridge platform operators
  AUDITOR:        BigInt(4),  // Read-only auditors
  PUBLIC:         BigInt("18446744073709551615"), // OZ PUBLIC_ROLE (2^64 - 1)
} as const;

// ─── Token AccessManager roles (per token) ───────────────────
export const TOKEN_ROLES = {
  SUPER_ADMIN: BigInt(0),  // OZ ADMIN_ROLE — issuer factory / governance
  TOKEN_ADMIN: BigInt(1),  // Issuer admin for this token
  MINTER:      BigInt(2),  // Can mint/burn tokens
  COMPLIANCE:  BigInt(3),  // Can freeze/unfreeze accounts, force transfers
  ENFORCER:    BigInt(4),  // Compliance enforcement (multisig recommended)
  PAUSER:      BigInt(5),  // Can pause/unpause token
  AUDITOR:     BigInt(6),  // Read-only
  PUBLIC:      BigInt("18446744073709551615"),
} as const;

export function getPlatformRoleName(roleId: bigint): string {
  const entry = Object.entries(PLATFORM_ROLES).find(([, id]) => id === roleId);
  return entry ? entry[0] : `ROLE_${roleId.toString()}`;
}

export function getTokenRoleName(roleId: bigint): string {
  const entry = Object.entries(TOKEN_ROLES).find(([, id]) => id === roleId);
  return entry ? entry[0] : `ROLE_${roleId.toString()}`;
}
