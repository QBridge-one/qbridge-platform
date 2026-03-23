// ============================================================
// lib/mock/platform-team.ts — QBridge ops dashboard (PlatformAccessManager)
// ============================================================

import type { TeamMember, TeamOnChainRoleDef } from "@/types/team";
import { PLATFORM_ROLES } from "@/lib/contracts/roles";
import { CHAIN_ROLE_BADGE_CLASS } from "@/lib/mock/team";

/** Same Tailwind map as issuer workspace; platform sheet only shows PLATFORM_TEAM_ROLE_DEFS keys. */
export const PLATFORM_TEAM_BADGE_CLASS = CHAIN_ROLE_BADGE_CLASS;

export const PLATFORM_TEAM_ROLE_DEFS: ReadonlyArray<TeamOnChainRoleDef> = [
  {
    key: "ADMIN",
    roleId: PLATFORM_ROLES.ADMIN,
    label: "ADMIN",
    description: "Full control over PlatformAccessManager — grant or revoke any platform role.",
  },
  {
    key: "COMPLIANCE",
    roleId: PLATFORM_ROLES.COMPLIANCE,
    label: "COMPLIANCE",
    description: "QBridge compliance — policy checks, regulatory workflows.",
  },
  {
    key: "OPERATOR",
    roleId: PLATFORM_ROLES.OPERATOR,
    label: "OPERATOR",
    description: "Platform operators — day-to-day QBridge console operations.",
  },
  {
    key: "AUDITOR",
    roleId: PLATFORM_ROLES.AUDITOR,
    label: "AUDITOR",
    description: "Read-only access to platform audit views and on-chain logs.",
  },
];

/** Seed rows for /ops/settings/team (replace with directory sync). */
export const MOCK_OPS_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "ops-1",
    email: "ops.lead@qbridge.io",
    displayName: "Jordan Lee",
    status: "active",
    platformRole: "admin",
    walletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    joinedAt: new Date("2024-06-01T12:00:00Z").toISOString(),
    lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
    avatarVariant: "teal",
    chainRoles: { COMPLIANCE: true, OPERATOR: true },
  },
  {
    id: "ops-2",
    email: "compliance@qbridge.io",
    displayName: "Alex Rivera",
    status: "active",
    platformRole: "member",
    walletAddress: "0x7aA71fCB5455E904DD028330e517AE87E4573E0c",
    joinedAt: new Date("2024-08-15T12:00:00Z").toISOString(),
    lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
    avatarVariant: "blue",
    chainRoles: { COMPLIANCE: true },
  },
  {
    id: "ops-3",
    email: "audit@qbridge.io",
    displayName: "Sam Okonkwo",
    status: "active",
    platformRole: "member",
    walletAddress: "0x3333333333333333333333333333333333333333",
    joinedAt: new Date("2025-01-10T12:00:00Z").toISOString(),
    lastActiveAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    avatarVariant: "purple",
    chainRoles: { AUDITOR: true },
  },
  {
    id: "ops-4",
    email: "new.hire@qbridge.io",
    displayName: "new.hire@qbridge.io",
    status: "invited",
    platformRole: "member",
    walletAddress: null,
    joinedAt: new Date().toISOString(),
    lastActiveAt: null,
    avatarVariant: "gray",
    chainRoles: {},
  },
];
