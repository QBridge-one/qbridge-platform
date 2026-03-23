"use client";

import { TeamAccessPage } from "@/components/team/TeamAccessPage";
import {
  MOCK_OPS_TEAM_MEMBERS,
  PLATFORM_TEAM_BADGE_CLASS,
  PLATFORM_TEAM_ROLE_DEFS,
} from "@/lib/mock/platform-team";

export default function OpsTeamPage() {
  return (
    <TeamAccessPage
      title="Access & Team"
      description="Manage QBridge internal team access and on-chain PlatformAccessManager roles. Dashboard login tier (Member/Admin) and platform roles are separate — both are shown in the table."
      initialMembers={MOCK_OPS_TEAM_MEMBERS}
      accessManager="platform"
      roleDefs={PLATFORM_TEAM_ROLE_DEFS}
      roleBadgeClass={PLATFORM_TEAM_BADGE_CLASS}
    />
  );
}
