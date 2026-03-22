import type { AccessManagerConfig } from "@/types/access-manager";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function RoleRegistry({ config }: { config: AccessManagerConfig }) {
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base">Role registry</CardTitle>
        <CardDescription>
          Canonical role ids and descriptions for this AccessManager contract.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-0">
        {config.roles.map((role, i) => (
          <div key={role.key}>
            {i > 0 && <Separator className="my-3" />}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
              <code className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-mono">
                id {role.id}
              </code>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{role.label}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {role.key}
                  </Badge>
                  {role.sensitive && (
                    <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">
                      Sensitive
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-snug">{role.description}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
