"use client";

import { TeamAccessPage } from "@/components/team/TeamAccessPage";
import { CHAIN_ROLE_BADGE_CLASS, CHAIN_ROLE_DEFS, MOCK_TEAM_MEMBERS } from "@/lib/mock/team";

export default function WorkspaceTeamPage() {
  return (
    <TeamAccessPage
      title="Access & Team"
      description="Manage who can access this issuer account and what they can do on-chain. Platform membership and blockchain roles are separate — both are shown in the table."
      initialMembers={MOCK_TEAM_MEMBERS}
      accessManager="token"
      roleDefs={CHAIN_ROLE_DEFS}
      roleBadgeClass={CHAIN_ROLE_BADGE_CLASS}
    />
  );
}
