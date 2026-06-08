"use client";

// ============================================================
// Step 7 — Review & Deploy
// Builds the DealConfig from the form, deploys via createDeal, then
// reads getDeployedDeal(dealId) to show the deployed cluster.
// ============================================================

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Rocket, CheckCircle2, ChevronDown, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { useCreateDeal } from "@/lib/hooks/useCreateDeal";
import { useGetDeployedDeal } from "@/lib/generated/factory";
import { useFactoryAddress } from "@/lib/hooks/useContracts";
import { buildDealConfig, dealIdFromName, ZERO_BYTES32 } from "@/lib/contracts/factory-payload";
import { DEAL_CLUSTER_LABELS, shareClassLabel } from "@/types/deal";
import type { DealWizardValues } from "@/lib/validators/deal-wizard";

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

export function StepReview() {
  const { getValues, watch } = useFormContext<DealWizardValues>();
  const { createDeal, isLoading, error, hash } = useCreateDeal();
  const factoryAddress = useFactoryAddress();
  const [deployed, setDeployed] = useState(false);

  const name = watch("name");
  const dealId = name ? dealIdFromName(name) : ZERO_BYTES32;

  const deal = useGetDeployedDeal(undefined, dealId);
  const record = deal.data as
    | { token: string; [k: string]: unknown }
    | undefined;
  const clusterReady = !!record && record.token && record.token !== ZERO_ADDR;

  const onDeploy = async () => {
    try {
      const config = buildDealConfig(getValues());
      await createDeal(config);
      setDeployed(true);
      // cluster is readable once the tx is mined; poll a few times
      for (let i = 0; i < 5; i++) {
        const res = await deal.refetch();
        const r = res.data as { token?: string } | undefined;
        if (r?.token && r.token !== ZERO_ADDR) break;
        await new Promise((res) => setTimeout(res, 2500));
      }
    } catch {
      /* surfaced via error state */
    }
  };

  const v = getValues();

  return (
    <div className="space-y-6">
      {!deployed && (
        <>
          <SummaryCard values={v} />

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>Inspect raw DealConfig</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 text-[11px] leading-relaxed">
                {safeStringify(buildDealConfig(v))}
              </pre>
            </CollapsibleContent>
          </Collapsible>

          {!factoryAddress && (
            <Notice tone="warn">
              Factory address is not configured for this network. Switch to a
              supported chain to deploy.
            </Notice>
          )}

          {error && <Notice tone="error">{error.message}</Notice>}

          <Button size="lg" className="w-full" onClick={onDeploy} disabled={isLoading || !factoryAddress}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deploying deal…
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Deploy deal cluster
              </>
            )}
          </Button>
        </>
      )}

      {deployed && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-50 p-3 text-sm dark:bg-emerald-950/30">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>
              Deal submitted{hash ? <> — tx <code className="font-mono text-xs">{hash}</code></> : null}.
            </span>
          </div>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Deployed cluster</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deal.refetch()}
                  disabled={deal.isFetching}
                >
                  <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${deal.isFetching ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {!clusterReady ? (
                <p className="text-sm text-muted-foreground">
                  Indexing on-chain… the cluster appears once the deploy tx is
                  mined. Use Refresh if it doesn’t show shortly.
                </p>
              ) : (
                <dl className="space-y-1.5">
                  {Object.entries(DEAL_CLUSTER_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between gap-3 text-xs">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="truncate font-mono">{String(record?.[key] ?? "—")}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Summary ──────────────────────────────────────────────────
function SummaryCard({ values }: { values: DealWizardValues }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{values.name || "—"}</p>
            <p className="text-xs text-muted-foreground">
              {values.symbol} · {values.decimals} decimals · {values.assetType}
            </p>
          </div>
          <Badge variant="outline">{values.category}</Badge>
        </div>
        <Separator />
        <Grid>
          <Item label="Global mint cap" value={values.globalMintCap || "—"} />
          <Item label="Unit price (cents)" value={values.unitPriceAtIssuance || "—"} />
          <Item label="Classes" value={String(values.classes.length)} />
          <Item
            label="Combined cap"
            value={values.combinedCapEnabled ? values.combinedCap : "off"}
          />
          <Item label="Timelock delay (s)" value={values.timelockMinDelay} />
          <Item label="Init NAV (cents)" value={values.navPerUnitCents || "—"} />
        </Grid>
        <Separator />
        <div className="space-y-1">
          {values.classes.map((c, i) => (
            <p key={i} className="text-xs text-muted-foreground">
              {shareClassLabel(c.shareClass)} · cap {c.classMintCap || "—"} ·{" "}
              {c.subTiers.length} sub-tier{c.subTiers.length === 1 ? "" : "s"}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">{children}</div>;
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="truncate font-mono text-xs">{value}</p>
    </div>
  );
}

function Notice({ tone, children }: { tone: "warn" | "error"; children: React.ReactNode }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
        tone === "error"
          ? "border-destructive/40 text-destructive"
          : "border-amber-500/40 text-amber-600 dark:text-amber-400"
      }`}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function safeStringify(obj: unknown): string {
  return JSON.stringify(obj, (_k, val) => (typeof val === "bigint" ? val.toString() : val), 2);
}
