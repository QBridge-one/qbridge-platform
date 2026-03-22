import type { AccessManagerConfig, HierarchyNode } from "@/types/access-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function Subtree({
  node,
  byParent,
  depth,
}: {
  node: HierarchyNode;
  byParent: Map<string, HierarchyNode[]>;
  depth: number;
}) {
  const children = byParent.get(node.id) ?? [];
  return (
    <li className="mt-2 list-none">
      <div
        className="rounded-lg border bg-card px-3 py-2"
        style={{ marginLeft: depth * 14 }}
      >
        <p className="text-sm font-semibold">{node.label}</p>
        {node.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{node.description}</p>
        )}
      </div>
      {children.length > 0 && (
        <ul className="mt-1 ml-3 list-none space-y-0 border-l border-border/70 pl-2">
          {children.map((c) => (
            <Subtree key={c.id} node={c} byParent={byParent} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function RoleHierarchy({ config }: { config: AccessManagerConfig }) {
  const byParent = new Map<string, HierarchyNode[]>();
  for (const n of config.hierarchy) {
    if (n.parentId === null) continue;
    if (!byParent.has(n.parentId)) byParent.set(n.parentId, []);
    byParent.get(n.parentId)!.push(n);
  }
  const roots = config.hierarchy.filter((n) => n.parentId === null);

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base">Role hierarchy</CardTitle>
        <CardDescription>
          Administrative tree for escalation paths (logical — verify on-chain AccessManager config).
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ul className="list-none space-y-1">
          {roots.map((r) => (
            <Subtree key={r.id} node={r} byParent={byParent} depth={0} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
