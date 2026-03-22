"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AccessManagerConfig } from "@/types/access-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberMatrix } from "./MemberMatrix";
import { RoleRegistry } from "./RoleRegistry";
import { RoleHierarchy } from "./RoleHierarchy";
import { ScheduledOpsQueue } from "./ScheduledOpsQueue";
import { FunctionRoleMap } from "./FunctionRoleMap";
import { AuditLog } from "./AuditLog";
import { AccessManagerActions } from "./AccessManagerActions";
import { useWallet } from "@/lib/hooks/useWallet";

export function AccessManagerPanel({ config }: { config: AccessManagerConfig }) {
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [matrixKey, setMatrixKey] = useState(0);

  const refetchMembers = () => {
    void queryClient.invalidateQueries();
    setMatrixKey((k) => k + 1);
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg">{config.title}</CardTitle>
            <CardDescription className="mt-1 max-w-2xl">{config.subtitle}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Badge variant={config.scope === "platform" ? "default" : "secondary"}>
              {config.scope === "platform" ? "Platform" : "Token"}
            </Badge>
            {config.contractAddress && (
              <Badge variant="outline" className="font-mono text-[10px] max-w-[220px] truncate">
                {config.contractAddress}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px]">
              chain {config.chainId}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="mb-4 h-auto w-full flex-wrap justify-start gap-1 bg-muted/40 p-1">
            <TabsTrigger value="members" className="text-xs">
              Members
            </TabsTrigger>
            <TabsTrigger value="roles" className="text-xs">
              Roles
            </TabsTrigger>
            <TabsTrigger value="hierarchy" className="text-xs">
              Hierarchy
            </TabsTrigger>
            <TabsTrigger value="operations" className="text-xs">
              Operations
            </TabsTrigger>
            <TabsTrigger value="functions" className="text-xs">
              Functions
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">
              Audit log
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-xs">
              Actions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="focus-visible:outline-none">
            <MemberMatrix key={matrixKey} config={config} />
          </TabsContent>
          <TabsContent value="roles" className="focus-visible:outline-none">
            <RoleRegistry config={config} />
          </TabsContent>
          <TabsContent value="hierarchy" className="focus-visible:outline-none">
            <RoleHierarchy config={config} />
          </TabsContent>
          <TabsContent value="operations" className="focus-visible:outline-none">
            <ScheduledOpsQueue config={config} />
          </TabsContent>
          <TabsContent value="functions" className="focus-visible:outline-none">
            <FunctionRoleMap config={config} />
          </TabsContent>
          <TabsContent value="audit" className="focus-visible:outline-none">
            <AuditLog config={config} />
          </TabsContent>
          <TabsContent value="actions" className="focus-visible:outline-none">
            <AccessManagerActions
              config={config}
              connectedAddress={address}
              onSuccess={() => refetchMembers()}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
