import type { AccessManagerConfig } from "@/types/access-manager";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function FunctionRoleMap({ config }: { config: AccessManagerConfig }) {
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base">Function → role map</CardTitle>
        <CardDescription>
          Which roles can execute restricted functions on this AccessManager (illustrative selectors).
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-3">
        {config.functionRoleMap.map((row, idx) => (
          <div key={`${row.functionLabel}-${idx}`} className="rounded-lg border bg-card p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{row.functionLabel}</p>
                <code className="mt-1 block text-[11px] text-muted-foreground font-mono truncate">
                  {row.functionSelector}
                </code>
              </div>
              <div className="flex flex-wrap gap-1">
                {row.requiredRoles.map((r) => (
                  <Badge key={r} variant="secondary" className="text-[10px]">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
