// ============================================================
// lib/mock/team.ts — Seed team (replace with auth provider fetch)
// ============================================================

import type { TeamMember, ChainRoleKey, AvatarVariant, TeamOnChainRoleDef } from "@/types/team";
import { TOKEN_ROLES } from "@/lib/contracts/roles";

/** Tailwind badge styles for every ChainRoleKey. SUPER_ADMIN/PLATFORM_ADMIN
 *  share the violet "owner" palette; TOKEN_ADMIN uses a parallel violet so
 *  the tier is visually distinct from functional chips. */
export const CHAIN_ROLE_BADGE_CLASS: Record<ChainRoleKey, string> = {
  SUPER_ADMIN:
    "border-transparent bg-violet-300 text-violet-950 dark:bg-violet-800/60 dark:text-violet-100",
  PLATFORM_ADMIN:
    "border-transparent bg-violet-200 text-violet-950 dark:bg-violet-900/50 dark:text-violet-200",
  TOKEN_ADMIN:
    "border-transparent bg-violet-200 text-violet-950 dark:bg-violet-900/50 dark:text-violet-200",
  MINTER:
    "border-transparent bg-sky-200 text-sky-950 dark:bg-sky-900/50 dark:text-sky-200",
  COMPLIANCE:
    "border-transparent bg-teal-200 text-teal-950 dark:bg-teal-900/50 dark:text-teal-200",
  ENFORCER:
    "border-transparent bg-red-200 text-red-950 dark:bg-red-900/50 dark:text-red-200",
  PAUSER:
    "border-transparent bg-amber-200 text-amber-950 dark:bg-amber-900/50 dark:text-amber-200",
  AUDITOR: "border-transparent bg-muted text-muted-foreground",
  OPERATOR:
    "border-transparent bg-indigo-200 text-indigo-950 dark:bg-indigo-900/50 dark:text-indigo-200",
};

export const AVATAR_VARIANT_CLASS: Record<AvatarVariant, string> = {
  blue: "bg-sky-200 text-sky-950 dark:bg-sky-900/40 dark:text-sky-100",
  purple: "bg-violet-200 text-violet-950 dark:bg-violet-900/40 dark:text-violet-100",
  teal: "bg-teal-200 text-teal-950 dark:bg-teal-900/40 dark:text-teal-100",
  amber: "bg-amber-200 text-amber-950 dark:bg-amber-900/40 dark:text-amber-100",
  gray: "bg-muted text-muted-foreground",
};

/** Token AccessManager role catalog shown in the issuer workspace UI.
 *
 *  ⚠ SUPER_ADMIN is exposed here for dev/staging convenience. In production
 *  this entry must be removed — role 0 is OZ ADMIN_ROLE; granting / revoking
 *  it bricks the token's AccessManager if mishandled and must move to the
 *  issuer factory / governance flow. Self-revoke is already guarded by
 *  isSelfLockoutKey() in TeamMemberSheet. */
export const CHAIN_ROLE_DEFS: ReadonlyArray<TeamOnChainRoleDef> = [
  {
    key: "SUPER_ADMIN",
    roleId: TOKEN_ROLES.SUPER_ADMIN,
    label: "Super Admin",
    description:
      "OZ ADMIN_ROLE — full control of this token's AccessManager. Dev/staging only; production grants go through the issuer factory.",
  },
  {
    key: "TOKEN_ADMIN",
    roleId: TOKEN_ROLES.TOKEN_ADMIN,
    label: "Token Admin",
    description:
      "Grants and revokes the operational roles below. Use for the issuer's primary admins.",
  },
  {
    key: "MINTER",
    roleId: TOKEN_ROLES.MINTER,
    label: "Minter",
    description: "Can mint and burn tokens for this asset.",
  },
  {
    key: "COMPLIANCE",
    roleId: TOKEN_ROLES.COMPLIANCE,
    label: "Compliance",
    description: "Can update transfer restrictions and investor eligibility rules.",
  },
  {
    key: "ENFORCER",
    roleId: TOKEN_ROLES.ENFORCER,
    label: "Enforcer",
    description: "Can freeze or unfreeze individual investor addresses.",
  },
  {
    key: "PAUSER",
    roleId: TOKEN_ROLES.PAUSER,
    label: "Pauser",
    description: "Can pause all token transfers in an emergency.",
  },
  {
    key: "AUDITOR",
    roleId: TOKEN_ROLES.AUDITOR,
    label: "Auditor",
    description: "Read-only access — can view all on-chain events and logs.",
  },
];

export function getRoleIdForKey(key: ChainRoleKey): bigint {
  const def = CHAIN_ROLE_DEFS.find((d) => d.key === key);
  if (!def) throw new Error(`Unknown chain role key: ${key}`);
  return def.roleId;
}

function activeChainKeys(m: TeamMember): ChainRoleKey[] {
  return (Object.entries(m.chainRoles) as [ChainRoleKey, boolean][])
    .filter(([, v]) => v)
    .map(([k]) => k);
}

/** Mock rows aligned with access_team_dashboard.html sample data. */
export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "tm-1",
    email: "sarah@meridianventures.com",
    displayName: "Sarah Chen",
    status: "active",
    platformRole: "admin",
    appRoles: ["issuer_admin", "issuer_compliance"],
    // Checksummed 0x…40 — viem strict validation (compliance / tx pipeline)
    walletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    joinedAt: new Date("2025-01-08T12:00:00Z").toISOString(),
    lastActiveAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    avatarVariant: "teal",
    chainRoles: { TOKEN_ADMIN: true, COMPLIANCE: true },
  },
  {
    id: "tm-2",
    email: "marcus@meridianventures.com",
    displayName: "Marcus Webb",
    status: "active",
    platformRole: "member",
    appRoles: ["issuer_operations"],
    walletAddress: "0x2222222222222222222222222222222222222222",
    joinedAt: new Date("2025-01-12T12:00:00Z").toISOString(),
    lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
    avatarVariant: "blue",
    chainRoles: { MINTER: true },
  },
  {
    id: "tm-3",
    email: "priya@meridianventures.com",
    displayName: "Priya Nair",
    status: "active",
    platformRole: "member",
    appRoles: ["issuer_auditor"],
    walletAddress: "0x3333333333333333333333333333333333333333",
    joinedAt: new Date("2025-02-03T12:00:00Z").toISOString(),
    lastActiveAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    avatarVariant: "purple",
    chainRoles: { AUDITOR: true },
  },
  {
    id: "tm-4",
    email: "james@meridianventures.com",
    displayName: "james@meridianventures.com",
    status: "invited",
    platformRole: "member",
    appRoles: ["issuer_member"],
    walletAddress: null,
    joinedAt: new Date().toISOString(),
    lastActiveAt: null,
    avatarVariant: "gray",
    chainRoles: {},
  },
];

export { activeChainKeys };
