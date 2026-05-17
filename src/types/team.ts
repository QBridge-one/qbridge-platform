// ============================================================
// types/team.ts — Issuer workspace team (platform + chain roles)
// Chain role IDs on-chain: bigint via src/lib/contracts/roles.ts
// ============================================================

import type { Address } from "@/lib/core/types";
import type { AppRole } from "@/lib/core/identity.types";

export type MemberStatus = "active" | "invited" | "suspended";

/** WorkOS / Clerk / auth — dashboard tier. NOT on-chain. */
export type PlatformRole = "admin" | "member";

/** Union of every on-chain role key the UI can display. Each plane (token
 *  / platform) only renders the subset that applies to its AccessManager. */
export type ChainRoleKey =
  | "SUPER_ADMIN"     // tier 0 — OZ ADMIN_ROLE (hidden from team UI)
  | "PLATFORM_ADMIN"  // tier 1 — platform AM
  | "TOKEN_ADMIN"     // tier 1 — token AM
  | "MINTER"
  | "COMPLIANCE"
  | "ENFORCER"
  | "PAUSER"
  | "AUDITOR"
  | "OPERATOR";

/** Coarse membership tier derived from chainRoles. Mirrors Clerk's
 *  owner/admin/member model so the UI can show a tier badge. */
export type ChainTier = "owner" | "admin" | "member";

/** Keys that put a member in the "admin" tier (tier 1). */
export const ADMIN_TIER_KEYS: ReadonlySet<ChainRoleKey> = new Set([
  "PLATFORM_ADMIN",
  "TOKEN_ADMIN",
]);

/**
 * Returns every tier the member holds, in descending order (owner → admin →
 * member). Owner and admin are NOT collapsed: when a wallet has both
 * SUPER_ADMIN and PLATFORM_ADMIN/TOKEN_ADMIN, the UI must show both chips
 * — otherwise a successful role-1 grant on an owner produces zero visual
 * feedback. "member" only renders when the wallet has *no* higher tier —
 * an owner who also holds COMPLIANCE already proves "has access" via the
 * functional chip, so an extra Member badge would be redundant noise.
 * Empty array means the member has no on-chain roles at all.
 */
export function deriveChainTiers(
  chainRoles: Partial<Record<ChainRoleKey, boolean>>,
): ChainTier[] {
  const tiers: ChainTier[] = [];
  if (chainRoles.SUPER_ADMIN) tiers.push("owner");
  for (const k of ADMIN_TIER_KEYS) {
    if (chainRoles[k]) {
      tiers.push("admin");
      break;
    }
  }
  if (tiers.length > 0) return tiers;
  const hasFunctional = (Object.entries(chainRoles) as [ChainRoleKey, boolean][])
    .some(([k, v]) => v && k !== "SUPER_ADMIN" && !ADMIN_TIER_KEYS.has(k));
  if (hasFunctional) tiers.push("member");
  return tiers;
}

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
  /** Granular off-chain roles held by this member. Source of truth for
   *  the permission matrix in the dashboard. Never empty for an active
   *  member (baseline at minimum). */
  appRoles?: AppRole[];
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
