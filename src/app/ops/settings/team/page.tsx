"use client";

import { AccessManagerPanel } from "@/components/access-manager/AccessManagerPanel";
import { useContracts } from "@/lib/hooks/useContracts";
import { buildPlatformAMConfig } from "@/lib/contracts/config-factory";
import { Badge } from "@/components/ui/badge";

export default function OpsTeamPage() {
  const { chainId } = useContracts();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team & access</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            QBridge platform roles (PlatformAccessManager). Separate from issuer token roles in{" "}
            <span className="font-medium text-foreground">Workspace</span>. Mock data until wagmi wiring is
            complete.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit shrink-0">
          QBridge Ops
        </Badge>
      </div>

      <AccessManagerPanel config={buildPlatformAMConfig(chainId)} />
    </div>
  );
}
