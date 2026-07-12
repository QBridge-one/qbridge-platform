"use client";

// ============================================================
// app/workspace/tokenized-deposits/new/page.tsx
//
// Scaffolded "Issue deposit token" wizard — one react-hook-form across 4
// steps, validated per-step via form.trigger(STEP_FIELDS[step]). Mirrors the
// stablecoin create wizard's shell (4-band layout + Stepper + step gating),
// but with NO live deploy: there is no tokenizedDepositFactory yet, so the
// final step presents a disabled action + the standing "issuance lands with
// the settlement adapter" note. See src/lib/products/registry.ts.
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
  X, ArrowLeft, ArrowRight, Check, Landmark, Lock, ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "@/lib/hooks/useWallet";
import { TRANSFER_POLICY_OPTIONS } from "@/types/stablecoin";
import {
  tokenizedDepositWizardSchema,
  STEP_FIELDS,
  type TokenizedDepositWizardValues,
} from "@/lib/validators/tokenized-deposit-wizard";
import { TextField, AddressField, NumberField, TextAreaField, SectionTitle } from "./_components/fields";

const LAST_STEP = 4;

const STEPS = [
  { number: 1, label: "Token", description: "Name, symbol, currency" },
  { number: 2, label: "Compliance", description: "Transfer policy" },
  { number: 3, label: "Settlement", description: "Core ledger & governance" },
  { number: 4, label: "Review", description: "Review & issue" },
];

// Fiat currencies a bank would denominate a deposit token in.
const CURRENCY_OPTIONS = [
  { value: "CAD", label: "CAD — Canadian dollar" },
  { value: "USD", label: "USD — US dollar" },
  { value: "EUR", label: "EUR — Euro" },
];

const DEFAULT_VALUES: TokenizedDepositWizardValues = {
  name: "",
  symbol: "",
  decimals: "2",
  currency: "CAD",
  description: "",
  transferPolicy: "0", // Allowlist (permissioned) — the deposit-token default
  jurisdiction: "Canada",
  coreLedgerAccount: "",
  settlementAdapter: "",
  issuerAdmin: "",
  timelockMinDelay: "0",
};

export default function NewTokenizedDepositPage() {
  const [step, setStep] = useState(1);
  const { address } = useWallet();

  const form = useForm<TokenizedDepositWizardValues>({
    resolver: zodResolver(tokenizedDepositWizardSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  });

  // Prefill the issuer admin with the connected wallet (client-only — avoids
  // an SSR hydration mismatch).
  useEffect(() => {
    if (address && !form.getValues("issuerAdmin")) {
      form.setValue("issuerAdmin", address);
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
              <h1 className="text-lg font-bold">Issue Deposit Token</h1>
              <Badge variant="outline" className="text-[10px]">{STEPS[step - 1]?.label}</Badge>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">Scaffolded</Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Define a bank-issued deposit token — permissioned transfer, core-ledger settled.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/workspace/tokenized-deposits">
              <X className="h-4 w-4" />
              <span className="sr-only">Cancel</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <div className="border-b bg-card px-6 py-5">
        <div className="mx-auto max-w-3xl">
          <Stepper currentStep={step} />
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
                  {step === 2 && <StepCompliance />}
                  {step === 3 && <StepSettlement />}
                  {step === 4 && <StepReview />}
                </CardContent>
              </Card>

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
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────
function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <ol className="flex items-center w-full">
      {STEPS.map((s, index) => {
        const isComplete = currentStep > s.number;
        const isCurrent = currentStep === s.number;
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
  const { control } = useFormContext<TokenizedDepositWizardValues>();
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField name="name" label="Deposit token name" required className="sm:col-span-2" placeholder="e.g. Acme Bank CAD Deposit" description="The issuer of record is a chartered bank." />
        <TextField name="symbol" label="Symbol" required mono placeholder="aCAD" description="≤12 chars." />
      </div>

      <TextAreaField name="description" label="Description" required placeholder="What this deposit token represents, the issuing bank, and redemption terms…" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField name="decimals" label="Decimals" required placeholder="2" description="2 is typical for a fiat-denominated deposit." />
        <FormField
          control={control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// ─── Step 2: Compliance & transfer ────────────────────────────
function StepCompliance() {
  const { control } = useFormContext<TokenizedDepositWizardValues>();
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <SectionTitle
          title="Transfer policy"
          hint="A deposit token is permissioned by default — only verified, jurisdiction-cleared holders can receive. Issuance & redemption are KYB-gated regardless."
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
        <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
            For bank money, keep <strong className="text-foreground">Allowlist (permissioned)</strong> — every holder must be
            KYB-verified and sanctions-screened. Enforced on-chain via an ERC-1400-style controlled transfer.
          </span>
        </div>
      </div>

      <TextField name="jurisdiction" label="Primary jurisdiction" required placeholder="Canada" description="Governs the deposit-liability and AML posture (e.g. OSFI / FINTRAC in Canada)." />
    </div>
  );
}

// ─── Step 3: Settlement & governance ──────────────────────────
function StepSettlement() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <SectionTitle
          title="Core-ledger settlement"
          hint="Issuance and redemption bind atomically to a posting on the bank's core ledger — a two-phase commit across the two ledgers, reconciled 1:1."
        />
        <TextField name="coreLedgerAccount" label="Core-ledger account" required placeholder="DDA / GL control account reference" description="The deposit control account the token reconciles against." />
        <AddressField name="settlementAdapter" label="Settlement adapter (optional)" description="On-chain address of the settlement adapter, once the core-banking integration is wired. Leave blank at scaffold time." />
      </div>

      <div className="space-y-4">
        <SectionTitle title="Governance" hint="Address prefilled with your connected wallet — change as needed." />
        <AddressField name="issuerAdmin" label="Issuer admin" required description="Administers this deposit token's on-chain roles (move to the timelock for production)." />
        <NumberField name="timelockMinDelay" label="Timelock min delay" required suffix="seconds" description="Delay before a queued upgrade can execute. 0 for testnet." />
      </div>
    </div>
  );
}

// ─── Step 4: Review & (scaffolded) issue ──────────────────────
function StepReview() {
  const { getValues } = useFormContext<TokenizedDepositWizardValues>();
  const v = getValues();
  const policyLabel =
    TRANSFER_POLICY_OPTIONS.find((o) => o.value === v.transferPolicy)?.label.split(" (")[0] ?? v.transferPolicy;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-4 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{v.name || "—"}</p>
              <p className="text-xs text-muted-foreground">
                {v.symbol} · {v.decimals} decimals · {v.currency}
              </p>
            </div>
            <Badge variant="outline">Tokenized Deposit</Badge>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            <Item label="Transfer policy" value={policyLabel} />
            <Item label="Jurisdiction" value={v.jurisdiction} />
            <Item label="Timelock delay" value={`${v.timelockMinDelay}s`} />
            <Item label="Core ledger" value={v.coreLedgerAccount || "—"} />
            <Item label="Settlement adapter" value={v.settlementAdapter || "— (pending)"} />
            <Item label="Issuer admin" value={v.issuerAdmin} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 rounded-md border border-amber-500/40 p-3 text-sm text-amber-600 dark:text-amber-400">
        <ArrowLeftRight className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Issuance lands with the core-ledger settlement adapter. The deposit cluster (factory, token,
          compliance) and the two-phase-commit binding to core banking are the remaining wiring — see
          the product roadmap.
        </span>
      </div>

      <Button size="lg" className="w-full" disabled>
        <Landmark className="mr-2 h-4 w-4" />
        Issue deposit token (pending settlement adapter)
      </Button>
    </div>
  );
}

// ─── Small pieces ─────────────────────────────────────────────
function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="truncate font-mono text-xs">{value}</p>
    </div>
  );
}
