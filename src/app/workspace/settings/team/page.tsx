"use client";

import { AccessManagerPanel } from "@/components/access-manager/AccessManagerPanel";
import { TestTransactionButton } from "@/components/dashboard/test-transaction-button";
import { useContracts } from "@/lib/hooks/useContracts";
import { buildTokenAMConfig } from "@/lib/contracts/config-factory";
import { Badge } from "@/components/ui/badge";

export default function WorkspaceTeamPage() {
  const { chainId } = useContracts();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team & access</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Token-scoped roles for your issuance (TokenAccessManager). Contract address comes from your
            workspace env / registry. Mock data until wagmi replaces{" "}
            <code className="text-xs bg-muted px-1 rounded">access-manager-mock</code>.
          </p>
        </div>
        <Badge variant="outline" className="w-fit shrink-0">
          Issuer workspace
        </Badge>
      </div>

      <AccessManagerPanel config={buildTokenAMConfig(chainId)} />

      <div className="mt-6">
        <TestTransactionButton />
      </div>
    </div>
  );
}
