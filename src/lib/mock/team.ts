// ============================================================
// lib/mock/team.ts — Seed team (replace with auth provider fetch)
// ============================================================

import type { TeamMember, ChainRoleKey, AvatarVariant, TeamOnChainRoleDef } from "@/types/team";
import { TOKEN_ROLES } from "@/lib/contracts/roles";

/** Tailwind-only badge styles per mockup (light + dark). */
export const CHAIN_ROLE_BADGE_CLASS: Record<ChainRoleKey, string> = {
  ADMIN:
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

export const CHAIN_ROLE_DEFS: ReadonlyArray<TeamOnChainRoleDef> = [
  {
    key: "ADMIN",
    roleId: TOKEN_ROLES.ADMIN,
    label: "ADMIN",
    description: "Full control — can grant or revoke any role on this contract.",
  },
  {
    key: "MINTER",
    roleId: TOKEN_ROLES.MINTER,
    label: "MINTER",
    description: "Can mint and burn tokens for this asset.",
  },
  {
    key: "COMPLIANCE",
    roleId: TOKEN_ROLES.COMPLIANCE,
    label: "COMPLIANCE",
    description: "Can update transfer restrictions and investor eligibility rules.",
  },
  {
    key: "ENFORCER",
    roleId: TOKEN_ROLES.ENFORCER,
    label: "ENFORCER",
    description: "Can freeze or unfreeze individual investor addresses.",
  },
  {
    key: "PAUSER",
    roleId: TOKEN_ROLES.PAUSER,
    label: "PAUSER",
    description: "Can pause all token transfers in an emergency.",
  },
  {
    key: "AUDITOR",
    roleId: TOKEN_ROLES.AUDITOR,
    label: "AUDITOR",
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
    chainRoles: { COMPLIANCE: true, AUDITOR: true },
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
