// ============================================================
// types/team.ts — Issuer workspace team (platform + chain roles)
// Chain role IDs on-chain: bigint via src/lib/contracts/roles.ts
// ============================================================

import type { Address } from "@/lib/core/types";

export type MemberStatus = "active" | "invited" | "suspended";

/** WorkOS / Clerk / auth — dashboard tier. NOT on-chain. */
export type PlatformRole = "admin" | "member";

/** Token roles (issuer workspace) + OPERATOR (QBridge platform only — not used on TokenAccessManager UI). */
export type ChainRoleKey =
  | "ADMIN"
  | "MINTER"
  | "COMPLIANCE"
  | "ENFORCER"
  | "PAUSER"
  | "AUDITOR"
  | "OPERATOR";

/** One row in the permissions sheet / role reference (manifest + on-chain id). */
export interface TeamOnChainRoleDef {
  key: ChainRoleKey;
  roleId: bigint;
  label: string;
  description: string;
}

export type AvatarVariant = "blue" | "purple" | "teal" | "amber" | "gray";

export interface TeamMember {
  id: string;
  email: string;
  displayName: string;
  status: MemberStatus;
  platformRole: PlatformRole;
  walletAddress: Address | null;
  joinedAt: string;
  /** ISO timestamp or null (e.g. invited, never active) */
  lastActiveAt: string | null;
  chainRoles: Partial<Record<ChainRoleKey, boolean>>;
  avatarVariant: AvatarVariant;
}

export interface TeamInvitePayload {
  email: string;
  platformRole: PlatformRole;
}
