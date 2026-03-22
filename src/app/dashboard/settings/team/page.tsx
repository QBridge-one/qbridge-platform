"use client";

import { AccessManagerPanel } from "@/components/access-manager/AccessManagerPanel";
import { TestTransactionButton } from "@/components/dashboard/test-transaction-button";
import { useContracts } from "@/lib/hooks/useContracts";
import { buildPlatformAMConfig, buildTokenAMConfig } from "@/lib/contracts/config-factory";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TeamPage() {
  const { chainId } = useContracts();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team & access</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Professional RBAC for QBridge platform AccessManager and per-token AccessManagers. Mock data
            until wagmi contract wiring replaces <code className="text-xs bg-muted px-1 rounded">access-manager-mock</code>.
          </p>
        </div>
        <Badge variant="outline" className="w-fit shrink-0">
          Mock preview
        </Badge>
      </div>

      <Tabs defaultValue="platform" className="w-full">
        <TabsList className="h-auto w-full max-w-md flex-wrap gap-1 bg-muted/50 p-1">
          <TabsTrigger value="platform" className="text-xs sm:text-sm">
            Platform access
          </TabsTrigger>
          <TabsTrigger value="token" className="text-xs sm:text-sm">
            Token access
          </TabsTrigger>
        </TabsList>
        <TabsContent value="platform" className="mt-6 focus-visible:outline-none">
          <AccessManagerPanel config={buildPlatformAMConfig(chainId)} />
        </TabsContent>
        <TabsContent value="token" className="mt-6 focus-visible:outline-none">
          <AccessManagerPanel config={buildTokenAMConfig(chainId)} />
        </TabsContent>
      </Tabs>

      {/* TEMPORARY: Remove when done testing transaction flow */}
      <div className="mt-6">
        <TestTransactionButton />
      </div>
    </div>
  );
}
