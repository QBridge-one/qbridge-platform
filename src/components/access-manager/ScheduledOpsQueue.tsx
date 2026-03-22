import type { AccessManagerConfig } from "@/types/access-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function shortAddr(a: string) {
  if (a.startsWith("0x") && a.length >= 10) {
    return `${a.slice(0, 6)}…${a.slice(-4)}`;
  }
  return a;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  ready: "default",
  cancelled: "outline",
};

export function ScheduledOpsQueue({ config }: { config: AccessManagerConfig }) {
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base">Scheduled operations</CardTitle>
        <CardDescription>
          Time-delayed grants and revokes (AccessManager scheduled ops). Actions are mock-only.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-3">
        {config.scheduledOps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scheduled operations.</p>
        ) : (
          config.scheduledOps.map((op) => (
            <div
              key={op.id}
              className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px] uppercase">
                    {op.kind}
                  </Badge>
                  <Badge variant={statusVariant[op.status] ?? "secondary"}>{op.status}</Badge>
                  <span className="text-sm font-medium">Role {op.roleKey}</span>
                </div>
                <p className="text-xs font-mono text-muted-foreground">
                  Target {shortAddr(op.targetAddress)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Execute {new Date(op.executeAt).toLocaleString()}
                </p>
                {op.note && <p className="text-xs text-muted-foreground italic">{op.note}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" disabled>
                  Cancel
                </Button>
                <Button size="sm" disabled>
                  Execute
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
