// ============================================================
// /ops/settings/team — server entry. Fetches real ops members and
// pending invites from the OrganizationPort, maps them into the
// TeamMember shape used by the client UI, and renders TeamAccessPage
// with view/manage gates wired in.
// ============================================================

import { TeamAccessPage } from "@/components/team/TeamAccessPage";
import {
  PLATFORM_TEAM_BADGE_CLASS,
  PLATFORM_TEAM_ROLE_DEFS,
} from "@/lib/mock/platform-team";
import { getSession } from "@/lib/auth/server";
import { can } from "@/lib/auth/permissions";
import { organizationAdapter } from "@/lib/container.server";
import {
  mapInviteToTeamMember,
  mapOrgMemberToTeamMember,
} from "@/lib/team/map";
import type { TeamMember } from "@/types/team";

export default async function OpsTeamPage() {
  const session = await getSession();
  const canInvite = can(session?.appRoles ?? null, "ops:team:invite");
  const canManage = can(session?.appRoles ?? null, "ops:team:remove");

  let initialMembers: TeamMember[] = [];
  if (session?.activeOrg && session.activeOrg.kind === "ops") {
    const orgId = session.activeOrg.id;
    const [members, invites] = await Promise.all([
      organizationAdapter.listMembers(orgId).catch(() => []),
      organizationAdapter.listInvites(orgId).catch(() => []),
    ]);
    initialMembers = [
      ...members.map(mapOrgMemberToTeamMember),
      ...invites.filter((i) => i.status === "pending").map(mapInviteToTeamMember),
    ];
  }

  return (
    <TeamAccessPage
      title="Access & Team"
      description="Manage QBridge internal team access and on-chain PlatformAccessManager roles. Dashboard login tier (Member/Admin) and platform roles are separate — both are shown in the table."
      initialMembers={initialMembers}
      accessManager="platform"
      roleDefs={PLATFORM_TEAM_ROLE_DEFS}
      roleBadgeClass={PLATFORM_TEAM_BADGE_CLASS}
      canInvite={canInvite}
      canManage={canManage}
    />
  );
}
