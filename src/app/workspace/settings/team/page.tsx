// ============================================================
// /workspace/settings/team — server entry. Fetches real members and
// pending invites from the OrganizationPort, maps them into the
// TeamMember shape used by the client UI, and renders TeamAccessPage
// with view/manage gates wired in.
// ============================================================

import { TeamAccessPage } from "@/components/team/TeamAccessPage";
import { CHAIN_ROLE_BADGE_CLASS, CHAIN_ROLE_DEFS } from "@/lib/mock/team";
import { getSession } from "@/lib/auth/server";
import { can } from "@/lib/auth/permissions";
import { organizationAdapter } from "@/lib/container.server";
import {
  mapInviteToTeamMember,
  mapOrgMemberToTeamMember,
} from "@/lib/team/map";
import type { TeamMember } from "@/types/team";

export default async function WorkspaceTeamPage() {
  const session = await getSession();
  const canInvite = can(session?.appRoles ?? null, "workspace:team:invite");
  const canManage = can(session?.appRoles ?? null, "workspace:team:remove");

  // Fetch real members + pending invites in parallel. Failures are
  // tolerated so the page still renders an empty list rather than 500.
  let initialMembers: TeamMember[] = [];
  if (session?.activeOrg && session.activeOrg.kind === "issuer") {
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
      description="Manage who can access this issuer account and what they can do on-chain. Platform membership and blockchain roles are separate — both are shown in the table."
      initialMembers={initialMembers}
      accessManager="token"
      roleDefs={CHAIN_ROLE_DEFS}
      roleBadgeClass={CHAIN_ROLE_BADGE_CLASS}
      canInvite={canInvite}
      canManage={canManage}
    />
  );
}
