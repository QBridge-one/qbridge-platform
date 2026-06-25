"use client";

// ============================================================
// app/workspace/stablecoins/new/page.tsx
//
// createStablecoin wizard — one react-hook-form across 4 steps, validated
// per-step via form.trigger(STEP_FIELDS[step]). The final step builds the
// StablecoinConfig and deploys through useCreateStablecoin. Mirrors the
// real-estate deal wizard; simpler (no NAV / classes / capital calls).
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  X, ArrowLeft, ArrowRight, RefreshCw, Check, Rocket, Loader2, CheckCircle2, ChevronDown, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "@/lib/hooks/useWallet";
import { useStablecoinFactoryAddress } from "@/lib/hooks/useContracts";
import { useCreateStablecoin } from "@/lib/hooks/useCreateStablecoin";
import { useGetDeployedStablecoin } from "@/lib/generated/stablecoin-factory";
import {
  buildStablecoinConfig,
  stablecoinIdFromName,
  toBytes32Label,
  randomBytes32,
  ZERO_BYTES32,
} from "@/lib/contracts/stablecoin-payload";
import {
  stablecoinWizardSchema,
  STEP_FIELDS,
  type StablecoinWizardValues,
} from "@/lib/validators/stablecoin-wizard";
import { STABLECOIN_CATEGORY, STABLECOIN_ASSET_TYPES, STABLECOIN_CLUSTER_LABELS, TRANSFER_POLICY_OPTIONS } from "@/types/stablecoin";
import { TextField, AddressField, NumberField, TextAreaField, SectionTitle } from "./_components/fields";

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
const LAST_STEP = 4;

const STEPS = [
  { number: 1, label: "Token", description: "Name, symbol, supply" },
  { number: 2, label: "Reserves", description: "Proof-of-reserves" },
  { number: 3, label: "Governance", description: "Roles & timelock" },
  { number: 4, label: "Review", description: "Review & deploy" },
];

const DEFAULT_VALUES: StablecoinWizardValues = {
  name: "",
  symbol: "",
  decimals: "6",
  description: "",
  category: STABLECOIN_CATEGORY,
  assetType: "USD_FIAT",
  treasury: "",
  globalMintCap: "0",
  transferPolicy: "1",
  salt: ZERO_BYTES32,
  maxReserveAttestationAge: "86400",
  maxReserveChangeBps: "1000",
  stalenessWarningSeconds: "3600",
  dealAdmin: "",
  platformProposer: "",
  issuerExecutor: "",
  timelockMinDelay: "0",
};

export default function NewStablecoinPage() {
  const [step, setStep] = useState(1);
  const [deployed, setDeployed] = useState(false);
  const { address } = useWallet();

  const form = useForm<StablecoinWizardValues>({
    resolver: zodResolver(stablecoinWizardSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  });

  // Seed client-only defaults (avoids SSR hydration mismatch). Prefill the
  // role/treasury addresses with the connected wallet for convenience — the
  // issuer can override (platformProposer is usually the platform's address).
  useEffect(() => {
    if (form.getValues("salt") === ZERO_BYTES32) {
      form.setValue("salt", randomBytes32());
    }
    if (address) {
      for (const f of ["treasury", "dealAdmin", "issuerExecutor", "platformProposer"] as const) {
        if (!form.getValues(f)) form.setValue(f, address);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const goTo = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onNext = async () => {
    const fields = STEP_FIELDS[step];
    const ok = fields ? await form.trigger(fields) : true;
    if (ok) goTo(Math.min(step + 1, LAST_STEP));
  };

  return (
    <div className="min-h-full bg-muted/30">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Create New Stablecoin</h1>
              <Badge variant="outline" className="text-[10px]">{STEPS[step - 1]?.label}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Deploy a fiat-backed, proof-of-reserves-gated stablecoin cluster on-chain.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/workspace/stablecoins">
              <X className="h-4 w-4" />
              <span className="sr-only">Cancel</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <div className="border-b bg-card px-6 py-5">
        <div className="mx-auto max-w-3xl">
          <Stepper currentStep={step} completed={deployed} />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()}>
              <Card className="shadow-sm">
                <CardContent className="p-6 sm:p-8">
                  {step === 1 && <StepToken />}
                  {step === 2 && <StepReserves />}
                  {step === 3 && <StepRoles />}
                  {step === 4 && <StepReview onDeployed={() => setDeployed(true)} />}
                </CardContent>
              </Card>

              {!deployed && (
                <div className="mt-4 flex items-center justify-between">
                  <Button type="button" variant="outline" onClick={() => goTo(Math.max(step - 1, 1))} disabled={step === 1}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  {step < LAST_STEP && (
                    <Button type="button" size="lg" onClick={onNext}>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────
function Stepper({ currentStep, completed }: { currentStep: number; completed: boolean }) {
  return (
    <ol className="flex items-center w-full">
      {STEPS.map((s, index) => {
        const isComplete = completed || currentStep > s.number;
        const isCurrent = !completed && currentStep === s.number;
        const isLast = index === STEPS.length - 1;
        return (
          <li key={s.number} className={cn("flex items-center", !isLast && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-background text-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]",
                  !isComplete && !isCurrent && "border-border bg-background text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : <span>{s.number}</span>}
              </div>
              <p className={cn("text-xs font-medium whitespace-nowrap", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                {s.label}
              </p>
            </div>
            {!isLast && <div className={cn("flex-1 h-px mx-3 -mt-5", isComplete ? "bg-primary" : "bg-border")} />}
          </li>
        );
      })}
    </ol>
  );
}

// ─── Step 1: Token ────────────────────────────────────────────
function StepToken() {
  const { control, watch, setValue } = useFormContext<StablecoinWizardValues>();
  const name = watch("name");
  const assetType = watch("assetType");
  const salt = watch("salt");

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField name="name" label="Stablecoin Name" required className="sm:col-span-2" placeholder="e.g. Acme USD" description="The on-chain stablecoinId is keccak256(name)." />
        <TextField name="symbol" label="Symbol" required mono placeholder="aUSD" description="≤12 chars." />
      </div>

      <TextAreaField name="description" label="Description" required placeholder="What this stablecoin is, who backs it, and the redemption terms…" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NumberField name="decimals" label="Decimals" required placeholder="6" description="6 is standard for USD." />
        <NumberField name="globalMintCap" label="Global Mint Cap" className="sm:col-span-2" suffix="base units" description="0 = unlimited at the base level (reserves still cap issuance)." />
      </div>

      <div className="space-y-4">
        <SectionTitle title="Classification" hint="Stored on-chain as bytes32 (keccak256 of the label)." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value={STABLECOIN_CATEGORY}>Stablecoin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="assetType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {STABLECOIN_ASSET_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <AddressField name="treasury" label="Treasury" required description="Receives fees / holds protocol balances for this token." />

      <div className="space-y-4">
        <SectionTitle
          title="Transfer policy"
          hint="Governs P2P transfers only — issuance & redemption are KYC-gated regardless."
        />
        <FormField
          control={control}
          name="transferPolicy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Holder model</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {TRANSFER_POLICY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {TRANSFER_POLICY_OPTIONS.find((o) => o.value === field.value)?.hint}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Salt + computed bytes32 preview */}
      <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
        <div className="flex items-center justify-between">
          <SectionTitle title="CREATE2 Salt" hint="Randomised per stablecoin for deterministic cluster addresses." />
          <Button type="button" variant="outline" size="sm" onClick={() => setValue("salt", randomBytes32(), { shouldValidate: true })}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Regenerate
          </Button>
        </div>
        <TextField name="salt" label="Salt (bytes32)" mono />
        <dl className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
          <PreviewRow label="stablecoinId" value={name ? stablecoinIdFromName(name) : "—"} />
          <PreviewRow label="assetType" value={assetType ? toBytes32Label(assetType) : "—"} />
          <PreviewRow label="salt" value={salt || "—"} />
        </dl>
      </div>
    </div>
  );
}

// ─── Step 2: Reserves (PoR) ───────────────────────────────────
function StepReserves() {
  return (
    <div className="space-y-8">
      <SectionTitle
        title="Proof-of-reserves gate"
        hint="Issuance is blocked until reserves are attested, and supply can never exceed attested reserves."
      />
      <NumberField
        name="maxReserveAttestationAge"
        label="Max attestation age"
        required
        suffix="seconds"
        description="Issuance halts if the latest reserve attestation is older than this. 0 disables the staleness gate. (86400 = 1 day)"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          name="maxReserveChangeBps"
          label="Max reserve change"
          required
          suffix="bps"
          description="Guardrail on how much one attestation may move reserves (1000 = 10%)."
        />
        <NumberField
          name="stalenessWarningSeconds"
          label="Staleness warning"
          required
          suffix="seconds"
          description="When to flag an attestation as ageing (before it hard-halts issuance)."
        />
      </div>
    </div>
  );
}

// ─── Step 3: Roles & governance ───────────────────────────────
function StepRoles() {
  return (
    <div className="space-y-8">
      <SectionTitle title="Operational roles" hint="Addresses prefilled with your connected wallet — change as needed." />
      <AddressField name="dealAdmin" label="Deal admin" required description="Administers this stablecoin's on-chain roles (move to the timelock for production)." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AddressField name="platformProposer" label="Platform proposer" required description="Proposes upgrades on the timelock (usually the QBridge platform address)." />
        <AddressField name="issuerExecutor" label="Issuer executor" required description="Executes timelocked upgrades after the delay." />
      </div>
      <NumberField name="timelockMinDelay" label="Timelock min delay" required suffix="seconds" description="Delay before a queued upgrade can execute. 0 for testnet." />
    </div>
  );
}

// ─── Step 4: Review & deploy ───────────────────────────────────
function StepReview({ onDeployed }: { onDeployed?: () => void }) {
  const { getValues } = useFormContext<StablecoinWizardValues>();
  const { createStablecoin, isLoading, error, hash } = useCreateStablecoin();
  const factoryAddress = useStablecoinFactoryAddress();
  const [deployed, setDeployed] = useState(false);

  const v = getValues();
  const stablecoinId = v.name ? stablecoinIdFromName(v.name) : ZERO_BYTES32;
  const rec = useGetDeployedStablecoin(undefined, stablecoinId);
  const record = rec.data as { token?: string; [k: string]: unknown } | undefined;
  const clusterReady = !!record?.token && record.token !== ZERO_ADDR;

  const onDeploy = async () => {
    try {
      const config = buildStablecoinConfig(getValues());
      await createStablecoin(config);
      setDeployed(true);
      onDeployed?.();
      for (let i = 0; i < 5; i++) {
        const res = await rec.refetch();
        const r = res.data as { token?: string } | undefined;
        if (r?.token && r.token !== ZERO_ADDR) break;
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
    } catch {
      /* surfaced via error state */
    }
  };

  return (
    <div className="space-y-6">
      {!deployed && (
        <>
          <Card>
            <CardContent className="space-y-4 p-4 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{v.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.symbol} · {v.decimals} decimals · {v.assetType}
                  </p>
                </div>
                <Badge variant="outline">{v.category}</Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                <Item label="Global mint cap" value={v.globalMintCap === "0" ? "Unlimited (base)" : v.globalMintCap} />
                <Item label="Transfer policy" value={TRANSFER_POLICY_OPTIONS.find((o) => o.value === v.transferPolicy)?.label.split(" (")[0] ?? v.transferPolicy} />
                <Item label="Max attestation age" value={`${v.maxReserveAttestationAge}s`} />
                <Item label="Max reserve change" value={`${v.maxReserveChangeBps} bps`} />
                <Item label="Staleness warning" value={`${v.stalenessWarningSeconds}s`} />
                <Item label="Timelock delay" value={`${v.timelockMinDelay}s`} />
                <Item label="Treasury" value={v.treasury} />
              </div>
            </CardContent>
          </Card>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>Inspect raw StablecoinConfig</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 text-[11px] leading-relaxed">
                {safeStringify(buildStablecoinConfig(v))}
              </pre>
            </CollapsibleContent>
          </Collapsible>

          {!factoryAddress && (
            <Notice tone="warn">
              Stablecoin factory address is not configured for this network. Switch to a supported chain to deploy.
            </Notice>
          )}
          {error && <Notice tone="error">{error.message}</Notice>}

          <Button size="lg" className="w-full" onClick={onDeploy} disabled={isLoading || !factoryAddress}>
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deploying stablecoin…</>
            ) : (
              <><Rocket className="mr-2 h-4 w-4" /> Deploy stablecoin cluster</>
            )}
          </Button>
        </>
      )}

      {deployed && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-50 p-3 text-sm dark:bg-emerald-950/30">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>
              Stablecoin submitted{hash ? <> — tx <code className="font-mono text-xs">{hash}</code></> : null}.
            </span>
          </div>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Deployed cluster</h3>
                <Button variant="ghost" size="sm" onClick={() => rec.refetch()} disabled={rec.isFetching}>
                  <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${rec.isFetching ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
              {!clusterReady ? (
                <p className="text-sm text-muted-foreground">
                  Indexing on-chain… the cluster appears once the deploy tx is mined. Use Refresh if it doesn’t show shortly.
                </p>
              ) : (
                <dl className="space-y-1.5">
                  {Object.entries(STABLECOIN_CLUSTER_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between gap-3 text-xs">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="truncate font-mono">{String(record?.[key] ?? "—")}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/workspace/stablecoins">
                Go to Stablecoins
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.location.assign("/workspace/stablecoins/new")}>
              Create another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small pieces ─────────────────────────────────────────────
function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <dt className="w-24 shrink-0 font-medium">{label}</dt>
      <dd className="truncate font-mono">{value}</dd>
    </div>
  );
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
        tone === "error" ? "border-destructive/40 text-destructive" : "border-amber-500/40 text-amber-600 dark:text-amber-400"
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
