// ============================================================
// lib/team/map.ts
// Map vendor-agnostic OrgMember + Invite domain models into the
// client-facing TeamMember shape used by the team UI.
//
// Server-only — pulls types from the identity domain. Pure code,
// no I/O.
// ============================================================

import type { Invite, OrgMember } from "@/lib/core/identity.types";
import type { AvatarVariant, TeamMember } from "@/types/team";

const AVATAR_VARIANTS: AvatarVariant[] = ["blue", "purple", "teal", "amber", "gray"];

/** Deterministic pick of an avatar variant from a stable seed (userId
 *  or invite id). Uses a tiny FNV-1a hash so the same user always
 *  shows the same color. */
export function pickAvatarVariant(seed: string): AvatarVariant {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const idx = Math.abs(h) % AVATAR_VARIANTS.length;
  return AVATAR_VARIANTS[idx];
}

/** Coarse "admin"/"member" derived from the granular role set. */
function platformRoleFromAppRoles(roles: readonly string[]): "admin" | "member" {
  return roles.some((r) => r.endsWith("_admin")) ? "admin" : "member";
}

/** Map an active org member into the dashboard TeamMember row. */
export function mapOrgMemberToTeamMember(m: OrgMember): TeamMember {
  const appRoles = m.appRoles && m.appRoles.length > 0 ? m.appRoles : [m.appRole];
  return {
    id: m.userId,
    email: m.email,
    displayName: m.displayName ?? m.email,
    status: m.status,
    platformRole: platformRoleFromAppRoles(appRoles),
    appRoles,
    walletAddress: m.walletAddress,
    joinedAt: m.joinedAt,
    lastActiveAt: m.lastActiveAt,
    // chainRoles come from on-chain AccessManager reads; populated by
    // a separate hook on the client. Empty here keeps the UI honest
    // ("No roles") until those reads land.
    chainRoles: {},
    avatarVariant: pickAvatarVariant(m.userId),
  };
}

/** Map a pending invite into a placeholder TeamMember row so the
 *  table can show "Invited" entries side-by-side with active members.
 *  The id is the invite id (NOT a user id) — `handleRemove` must
 *  branch by status to route to the correct API. */
export function mapInviteToTeamMember(inv: Invite): TeamMember {
  const appRoles = inv.appRoles && inv.appRoles.length > 0 ? inv.appRoles : [inv.appRole];
  return {
    id: inv.id,
    email: inv.email,
    displayName: inv.email,
    status: "invited",
    platformRole: platformRoleFromAppRoles(appRoles),
    appRoles,
    walletAddress: null,
    joinedAt: inv.createdAt,
    lastActiveAt: null,
    chainRoles: {},
    avatarVariant: pickAvatarVariant(inv.id),
  };
}
