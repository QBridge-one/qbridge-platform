// ============================================================
// lib/contracts/roles.ts
//
// Role ID constants for both AccessManager contracts.
// Role IDs are uint64 in Solidity → bigint in TypeScript.
// NEVER use plain numbers — always use these constants.
//
// Platform roles: QBridge internal governance
// Token roles: Per-issuer per-token (one TokenAccessManager per token)
// ============================================================

// ─── Platform AccessManager roles ────────────────────────────
export const PLATFORM_ROLES = {
  ADMIN:      BigInt(0),   // OpenZeppelin built-in admin (ADMIN_ROLE)
  COMPLIANCE: BigInt(1),   // QBridge compliance team
  OPERATOR:   BigInt(2),   // QBridge platform operators
  AUDITOR:    BigInt(3),   // Read-only auditors
  PUBLIC:     BigInt("18446744073709551615"), // OpenZeppelin PUBLIC_ROLE (2^64 - 1)
} as const;

// ─── Token AccessManager roles ────────────────────────────────
export const TOKEN_ROLES = {
  ADMIN:      BigInt(0),   // Issuer admin
  MINTER:     BigInt(10),  // Can mint/burn tokens
  COMPLIANCE: BigInt(11),  // Can freeze/unfreeze accounts, force transfers
  ENFORCER:   BigInt(12),  // Can execute compliance enforcement (multisig required)
  PAUSER:     BigInt(13),  // Can pause/unpause token
  AUDITOR:    BigInt(14),  // Read-only
  PUBLIC:     BigInt("18446744073709551615"), // OpenZeppelin PUBLIC_ROLE (2^64 - 1)
} as const;

// Helper to get role name from ID
export function getPlatformRoleName(roleId: bigint): string {
  const entry = Object.entries(PLATFORM_ROLES).find(([, id]) => id === roleId);
  return entry ? entry[0] : `ROLE_${roleId.toString()}`;
}

export function getTokenRoleName(roleId: bigint): string {
  const entry = Object.entries(TOKEN_ROLES).find(([, id]) => id === roleId);
  return entry ? entry[0] : `ROLE_${roleId.toString()}`;
}
