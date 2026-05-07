// ============================================================
// /ops/settings/team — server entry, computes RBAC + renders the
// client TeamAccessPage with view/manage gates wired in.
// ============================================================

import { TeamAccessPage } from "@/components/team/TeamAccessPage";
import {
  MOCK_OPS_TEAM_MEMBERS,
  PLATFORM_TEAM_BADGE_CLASS,
  PLATFORM_TEAM_ROLE_DEFS,
} from "@/lib/mock/platform-team";
import { getSession } from "@/lib/auth/server";
import { can } from "@/lib/auth/permissions";

export default async function OpsTeamPage() {
  const session = await getSession();
  const canInvite = can(session?.appRole ?? null, "ops:team:invite");
  const canManage = can(session?.appRole ?? null, "ops:team:remove");

  return (
    <TeamAccessPage
      title="Access & Team"
      description="Manage QBridge internal team access and on-chain PlatformAccessManager roles. Dashboard login tier (Member/Admin) and platform roles are separate — both are shown in the table."
      initialMembers={MOCK_OPS_TEAM_MEMBERS}
      accessManager="platform"
      roleDefs={PLATFORM_TEAM_ROLE_DEFS}
      roleBadgeClass={PLATFORM_TEAM_BADGE_CLASS}
      canInvite={canInvite}
      canManage={canManage}
    />
  );
}
