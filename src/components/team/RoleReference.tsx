"use client";

import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import type { TeamOnChainRoleDef } from "@/types/team";
import { CHAIN_ROLE_BADGE_CLASS, CHAIN_ROLE_DEFS } from "@/lib/mock/team";
import { cn } from "@/lib/utils";

interface RoleReferenceProps {
  defs?: ReadonlyArray<TeamOnChainRoleDef>;
  badgeClass?: Record<TeamOnChainRoleDef["key"], string>;
}

export function RoleReference({
  defs = CHAIN_ROLE_DEFS,
  badgeClass = CHAIN_ROLE_BADGE_CLASS,
}: RoleReferenceProps) {
  return (
    <Collapsible
      defaultOpen={false}
      className="group overflow-hidden rounded-lg border border-border"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between bg-muted/50 px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted">
        <span>Role reference</span>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-0 divide-y divide-border px-3 py-2">
          {defs.map((d) => (
            <div key={d.key} className="flex flex-wrap items-center gap-2 py-2 first:pt-0 last:pb-0">
              <Badge variant="outline" className={cn("text-xs font-medium", badgeClass[d.key])}>
                {d.label}
              </Badge>
              <span className="min-w-0 flex-1 text-xs text-muted-foreground">{d.description}</span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
