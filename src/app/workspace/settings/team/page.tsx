// ============================================================
// /workspace/settings/team — server entry, computes RBAC + renders
// the client TeamAccessPage with view/manage gates wired in.
// ============================================================

import { TeamAccessPage } from "@/components/team/TeamAccessPage";
import { CHAIN_ROLE_BADGE_CLASS, CHAIN_ROLE_DEFS, MOCK_TEAM_MEMBERS } from "@/lib/mock/team";
import { getSession } from "@/lib/auth/server";
import { can } from "@/lib/auth/permissions";

export default async function WorkspaceTeamPage() {
  const session = await getSession();
  const canInvite = can(session?.appRoles ?? null, "workspace:team:invite");
  const canManage = can(session?.appRoles ?? null, "workspace:team:remove");

  return (
    <TeamAccessPage
      title="Access & Team"
      description="Manage who can access this issuer account and what they can do on-chain. Platform membership and blockchain roles are separate — both are shown in the table."
      initialMembers={MOCK_TEAM_MEMBERS}
      accessManager="token"
      roleDefs={CHAIN_ROLE_DEFS}
      roleBadgeClass={CHAIN_ROLE_BADGE_CLASS}
      canInvite={canInvite}
      canManage={canManage}
    />
  );
}
