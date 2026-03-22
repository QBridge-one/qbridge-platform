import type { AccessManagerConfig } from "@/types/access-manager";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function AuditLog({ config }: { config: AccessManagerConfig }) {
  const sorted = [...config.auditLog].sort(
    (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()
  );

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base">Audit log</CardTitle>
        <CardDescription>
          Recent AccessManager events (mock). Wire to indexer / subgraph later.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit entries.</p>
        ) : (
          <ul className="space-y-0">
            {sorted.map((e, i) => (
              <li key={e.id}>
                {i > 0 && <Separator className="my-3" />}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {e.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(e.ts).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{e.detail}</p>
                    <p className="text-xs text-muted-foreground">Actor {e.actor}</p>
                  </div>
                  {e.txHash && (
                    <code className="text-[10px] font-mono text-muted-foreground shrink-0 max-w-[140px] truncate sm:max-w-none">
                      {e.txHash}
                    </code>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
