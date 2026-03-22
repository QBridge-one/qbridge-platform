"use client";

// ============================================================
// app/dashboard/assets/new/_components/step-compliance.tsx
// Step 4 — KYC tier, transfer rules, jurisdiction, freeze config
// Aligned with IComplianceChecker + BaseAssetToken params
// ============================================================

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { complianceSchema, type ComplianceSchema } from "@/lib/validators/asset-wizard";
import type { ComplianceFormData } from "@/types/assets";
import { KYC_TIERS, TRANSFER_MODES, JURISDICTIONS } from "@/types/assets";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Info, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { JurisdictionCode } from "@/types/assets";

interface StepComplianceProps {
  defaultValues?: Partial<ComplianceFormData>;
  onNext: (data: ComplianceFormData) => void;
  onBack: () => void;
}

export function StepCompliance({ defaultValues, onNext, onBack }: StepComplianceProps) {
  const form = useForm<ComplianceSchema>({
    resolver: zodResolver(complianceSchema),
    defaultValues: {
      kycTier: defaultValues?.kycTier ?? "KYC_1",
      transferMode: defaultValues?.transferMode ?? "WHITELIST_ONLY",
      holdPeriodDays: defaultValues?.holdPeriodDays ?? undefined,
      maxInvestors: defaultValues?.maxInvestors ?? undefined,
      minInvestmentAmount: defaultValues?.minInvestmentAmount ?? "",
      maxInvestmentAmount: defaultValues?.maxInvestmentAmount ?? "",
      allowedJurisdictions: defaultValues?.allowedJurisdictions ?? [],
      blockedJurisdictions: defaultValues?.blockedJurisdictions ?? [],
      enableProofOfBacking: defaultValues?.enableProofOfBacking ?? false,
      requireAccreditedStatus: defaultValues?.requireAccreditedStatus ?? true,
      complianceCheckerAddress: defaultValues?.complianceCheckerAddress ?? "",
    },
  });

  const transferMode = form.watch("transferMode");
  const [allowedInput, setAllowedInput] = useState<JurisdictionCode | "">("");
  const [blockedInput, setBlockedInput] = useState<JurisdictionCode | "">("");

  const addAllowed = (val: JurisdictionCode) => {
    const current = form.getValues("allowedJurisdictions");
    if (!current.includes(val)) {
      form.setValue("allowedJurisdictions", [...current, val]);
    }
    setAllowedInput("");
  };

  const removeAllowed = (val: string) => {
    form.setValue(
      "allowedJurisdictions",
      form.getValues("allowedJurisdictions").filter((j) => j !== val)
    );
  };

  const addBlocked = (val: JurisdictionCode) => {
    const current = form.getValues("blockedJurisdictions");
    if (!current.includes(val)) {
      form.setValue("blockedJurisdictions", [...current, val]);
    }
    setBlockedInput("");
  };

  const removeBlocked = (val: string) => {
    form.setValue(
      "blockedJurisdictions",
      form.getValues("blockedJurisdictions").filter((j) => j !== val)
    );
  };

  const allowedJurisdictions = form.watch("allowedJurisdictions");
  const blockedJurisdictions = form.watch("blockedJurisdictions");

  const onSubmit = (data: ComplianceSchema) => {
    onNext(data as ComplianceFormData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* ── Info banner ── */}
        <div className="flex items-start gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
          <span>
            These rules are passed to your{" "}
            <code className="bg-muted px-1 rounded">IComplianceChecker</code> and
            enforced on-chain at every transfer via{" "}
            <code className="bg-muted px-1 rounded">_update()</code> in
            BaseAssetToken. Choose carefully — some rules cannot be relaxed after
            deployment without a contract upgrade.
          </span>
        </div>

        {/* ── KYC Tier ── */}
        <FormField
          control={form.control}
          name="kycTier"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                Minimum KYC Tier <span className="text-destructive">*</span>
              </FormLabel>
              <FormDescription>
                The minimum verification level required for investors to hold and
                transact this token.
              </FormDescription>
              <div className="grid grid-cols-2 gap-2 mt-2 sm:grid-cols-3">
                {KYC_TIERS.map((tier) => (
                  <button
                    key={tier.value}
                    type="button"
                    onClick={() => field.onChange(tier.value)}
                    className={cn(
                      "rounded-lg border-2 px-3 py-2.5 text-left text-xs transition-all hover:border-primary/60",
                      field.value === tier.value
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* ── Transfer Mode ── */}
        <FormField
          control={form.control}
          name="transferMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                Transfer Restriction Mode <span className="text-destructive">*</span>
              </FormLabel>
              <FormDescription>
                Controls how token transfers are restricted beyond standard compliance
                checks.
              </FormDescription>
              <div className="grid grid-cols-1 gap-2 mt-2 sm:grid-cols-2">
                {TRANSFER_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => field.onChange(mode.value)}
                    className={cn(
                      "rounded-lg border-2 p-3 text-left transition-all hover:border-primary/60",
                      field.value === mode.value
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <p className="text-sm font-medium">{mode.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {mode.description}
                    </p>
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hold period — only show when HOLD_PERIOD is selected */}
        {transferMode === "HOLD_PERIOD" && (
          <FormField
            control={form.control}
            name="holdPeriodDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Hold Period (days) <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="3650"
                    placeholder="e.g. 365"
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  />
                </FormControl>
                <FormDescription>
                  Tokens are locked for this many days after initial purchase.
                  Common: 365 (Reg D), 180 (Reg S).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Separator />

        {/* ── Investor Limits ── */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Investor Limits</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="maxInvestors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Investors</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="e.g. 2000"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>Reg D 506(b) limit: 35 non-accredited.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minInvestmentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min Investment</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 10000"
                      min="0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>In offering currency.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxInvestmentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Investment</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 5000000"
                      min="0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Per investor cap.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* ── Jurisdiction Controls ── */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Jurisdiction Controls</h3>

          {/* Allowed */}
          <FormField
            control={form.control}
            name="allowedJurisdictions"
            render={() => (
              <FormItem>
                <FormLabel>Allowed Jurisdictions</FormLabel>
                <div className="flex gap-2 mt-1">
                  <Select
                    value={allowedInput}
                    onValueChange={(v) => {
                      addAllowed(v as JurisdictionCode);
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Add allowed jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      {JURISDICTIONS.filter(
                        (j) => !allowedJurisdictions.includes(j.value)
                      ).map((j) => (
                        <SelectItem key={j.value} value={j.value}>
                          {j.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {allowedJurisdictions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allowedJurisdictions.map((j) => (
                      <Badge key={j} variant="secondary" className="gap-1 text-xs">
                        {j}
                        <button
                          type="button"
                          onClick={() => removeAllowed(j)}
                          className="ml-0.5 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <FormDescription>
                  Leave empty to allow all jurisdictions (except blocked ones).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Blocked */}
          <FormField
            control={form.control}
            name="blockedJurisdictions"
            render={() => (
              <FormItem>
                <FormLabel>Blocked Jurisdictions</FormLabel>
                <div className="flex gap-2 mt-1">
                  <Select
                    value={blockedInput}
                    onValueChange={(v) => {
                      addBlocked(v as JurisdictionCode);
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Add blocked jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      {JURISDICTIONS.filter(
                        (j) => !blockedJurisdictions.includes(j.value)
                      ).map((j) => (
                        <SelectItem key={j.value} value={j.value}>
                          {j.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {blockedJurisdictions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {blockedJurisdictions.map((j) => (
                      <Badge
                        key={j}
                        variant="destructive"
                        className="gap-1 text-xs opacity-80"
                      >
                        {j}
                        <button
                          type="button"
                          onClick={() => removeBlocked(j)}
                          className="ml-0.5 hover:opacity-70"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* ── Toggles ── */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Additional Controls</h3>

          <FormField
            control={form.control}
            name="requireAccreditedStatus"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm">
                    Require Accredited Investor Status
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Only accredited/qualified purchasers can hold this token.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="enableProofOfBacking"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm">
                    Enable Proof of Backing Checks
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Enforce IBackingVerifier checks on all token operations.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* ── Compliance Checker Address ── */}
        <FormField
          control={form.control}
          name="complianceCheckerAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Compliance Checker Contract{" "}
                <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="0x... — leave blank to use platform default"
                  className="font-mono text-xs"
                  {...field}
                />
              </FormControl>
              <FormDescription className="flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Your custom{" "}
                <code className="bg-muted px-1 rounded text-[11px]">
                  IComplianceChecker
                </code>{" "}
                implementation. If empty, the platform&apos;s default compliance
                contract is used.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Actions ── */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button type="submit" size="lg">
            Continue to Review
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
