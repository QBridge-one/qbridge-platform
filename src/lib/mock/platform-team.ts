// ============================================================
// lib/mock/platform-team.ts — QBridge ops dashboard (PlatformAccessManager)
// ============================================================

import type { TeamMember, TeamOnChainRoleDef } from "@/types/team";
import { PLATFORM_ROLES } from "@/lib/contracts/roles";
import { CHAIN_ROLE_BADGE_CLASS } from "@/lib/mock/team";

/** Same Tailwind map as issuer workspace; platform sheet only shows PLATFORM_TEAM_ROLE_DEFS keys. */
export const PLATFORM_TEAM_BADGE_CLASS = CHAIN_ROLE_BADGE_CLASS;

/** Platform AccessManager role catalog shown in the ops UI.
 *
 *  ⚠ SUPER_ADMIN is exposed here for dev/staging convenience. In production
 *  this entry must be removed — role 0 is OZ ADMIN_ROLE; granting / revoking
 *  it bricks the AccessManager if mishandled and must move to governance
 *  (multisig / Etherscan). Self-revoke is already guarded by
 *  isSelfLockoutKey() in TeamMemberSheet. */
export const PLATFORM_TEAM_ROLE_DEFS: ReadonlyArray<TeamOnChainRoleDef> = [
  {
    key: "SUPER_ADMIN",
    roleId: PLATFORM_ROLES.SUPER_ADMIN,
    label: "Super Admin",
    description:
      "OZ ADMIN_ROLE — full control of the platform AccessManager. Dev/staging only; production grants go through governance.",
  },
  {
    key: "PLATFORM_ADMIN",
    roleId: PLATFORM_ROLES.PLATFORM_ADMIN,
    label: "Platform Admin",
    description:
      "Grants and revokes the operational platform roles below. Day-to-day QBridge admin.",
  },
  {
    key: "COMPLIANCE",
    roleId: PLATFORM_ROLES.COMPLIANCE,
    label: "Compliance",
    description: "QBridge compliance — policy checks, regulatory workflows.",
  },
  {
    key: "OPERATOR",
    roleId: PLATFORM_ROLES.OPERATOR,
    label: "Operator",
    description: "Platform operators — day-to-day QBridge console operations.",
  },
  {
    key: "AUDITOR",
    roleId: PLATFORM_ROLES.AUDITOR,
    label: "Auditor",
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
    appRoles: ["ops_admin"],
    walletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    joinedAt: new Date("2024-06-01T12:00:00Z").toISOString(),
    lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
    avatarVariant: "teal",
    chainRoles: { PLATFORM_ADMIN: true, COMPLIANCE: true },
  },
  {
    id: "ops-2",
    email: "compliance@qbridge.io",
    displayName: "Alex Rivera",
    status: "active",
    platformRole: "member",
    appRoles: ["ops_compliance"],
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
    appRoles: ["ops_member"],
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
    appRoles: ["ops_member"],
    walletAddress: null,
    joinedAt: new Date().toISOString(),
    lastActiveAt: null,
    avatarVariant: "gray",
    chainRoles: {},
  },
];
