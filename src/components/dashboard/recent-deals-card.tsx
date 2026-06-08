"use client";

// Real "Recent Assets" card for the issuer overview — latest deployed
// deal tokens from TokenRegistry (replaces the mock list).

import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/lib/hooks/useWallet";
import { useIssuerTokens } from "@/lib/hooks/useIssuerTokens";
import { decodeAssetType, shortAddress } from "@/lib/contracts/deal-labels";

const MAX = 5;

export function RecentDealsCard() {
  const { address } = useWallet();
  const { rows, isLoading } = useIssuerTokens(address);
  const recent = [...rows].sort((a, b) => b.deployedAt - a.deployedAt).slice(0, MAX);

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Recent Assets</CardTitle>
          <CardDescription className="text-xs">Your tokenized asset portfolio</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/workspace/assets" className="text-xs">
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {!address ? (
          <Message>Connect your wallet to see your deployed deals.</Message>
        ) : isLoading && rows.length === 0 ? (
          <Message>Loading…</Message>
        ) : recent.length === 0 ? (
          <Message>
            No deals yet.{" "}
            <Link href="/workspace/assets/new" className="text-primary underline-offset-2 hover:underline">
              Create your first deal
            </Link>
            .
          </Message>
        ) : (
          <div className="divide-y">
            {recent.map((d) => (
              <Link
                key={d.token}
                href={`/workspace/assets/${d.token}`}
                className="group flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{d.name || "Untitled deal"}</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {d.symbol || shortAddress(d.token)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{decodeAssetType(d.assetType)}</span>
                </div>
                {d.delisted ? (
                  <Badge variant="secondary" className="shrink-0 text-[10px] text-muted-foreground">Delisted</Badge>
                ) : (
                  <Badge className="shrink-0 border-transparent bg-emerald-500/15 text-[10px] text-emerald-600 dark:text-emerald-400">Listed</Badge>
                )}
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return <p className="px-6 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}
