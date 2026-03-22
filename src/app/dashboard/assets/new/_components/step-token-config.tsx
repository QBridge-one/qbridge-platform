"use client";

// ============================================================
// app/dashboard/assets/new/_components/step-token-config.tsx
// Step 2 — Token supply, price, decimals, treasury, backing
// Aligned with BaseAssetToken constructor params
// ============================================================

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tokenConfigSchema, type TokenConfigSchema } from "@/lib/validators/asset-wizard";
import type { TokenConfigFormData } from "@/types/assets";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Info, ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepTokenConfigProps {
  defaultValues?: Partial<TokenConfigFormData>;
  onNext: (data: TokenConfigFormData) => void;
  onBack: () => void;
}

const DECIMAL_DESCRIPTIONS: Record<string, string> = {
  "6": "Standard for stablecoins and fiat-pegged tokens (USDC, CADC)",
  "8": "Standard for commodity tokens (similar to Bitcoin's satoshi precision)",
  "18": "Standard ERC-20 precision — use for equity-like or divisible tokens",
};

export function StepTokenConfig({ defaultValues, onNext, onBack }: StepTokenConfigProps) {
  const form = useForm<TokenConfigSchema>({
    resolver: zodResolver(tokenConfigSchema),
    defaultValues: {
      tokenStandard: "ERC20_SECURITY",
      totalSupply: defaultValues?.totalSupply ?? "",
      pricePerToken: defaultValues?.pricePerToken ?? "",
      currency: defaultValues?.currency ?? "USD",
      decimals: defaultValues?.decimals ?? "18",
      softCap: defaultValues?.softCap ?? "",
      hardCap: defaultValues?.hardCap ?? "",
      treasuryAddress: defaultValues?.treasuryAddress ?? "",
      enableBacking: defaultValues?.enableBacking ?? false,
      backingVerifierAddress: defaultValues?.backingVerifierAddress ?? "",
    },
  });

  const enableBacking = form.watch("enableBacking");
  const decimals = form.watch("decimals");
  const totalSupply = form.watch("totalSupply");
  const pricePerToken = form.watch("pricePerToken");
  const currency = form.watch("currency");

  // Computed total raise
  const totalRaise =
    !isNaN(Number(totalSupply)) &&
    !isNaN(Number(pricePerToken)) &&
    Number(totalSupply) > 0 &&
    Number(pricePerToken) > 0
      ? (Number(totalSupply) * Number(pricePerToken)).toLocaleString("en-US", {
          maximumFractionDigits: 0,
        })
      : null;

  const onSubmit = (data: TokenConfigSchema) => {
    onNext(data as TokenConfigFormData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* ── Token Standard (display only) ── */}
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <span className="text-xs font-bold text-primary">ERC</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Custom ERC-20 Security Token</p>
            <p className="text-xs text-muted-foreground">
              BaseAssetToken — compliance hooks, freeze, force transfer, dual access control
            </p>
          </div>
          <Badge variant="secondary" className="text-[10px]">Fixed</Badge>
        </div>

        {/* ── Supply + Price ── */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Supply & Pricing</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="totalSupply"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Total Token Supply <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 10000000"
                      type="number"
                      min="1"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Total number of tokens to mint. Cannot be changed after deployment.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              {/* Plain Label: shared heading for currency + amount (not inside a single FormField) */}
              <Label className="text-sm font-medium">
                Price Per Token <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem className="w-28 shrink-0">
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["USD", "CAD", "EUR", "USDC"].map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pricePerToken"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="e.g. 10.00"
                          type="number"
                          step="0.000001"
                          min="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {totalRaise && (
                <p className="text-xs text-muted-foreground">
                  Total raise at full supply:{" "}
                  <span className="font-medium text-foreground">
                    {currency} {totalRaise}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Decimals ── */}
        <FormField
          control={form.control}
          name="decimals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Token Decimals <span className="text-destructive">*</span>
              </FormLabel>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {(["6", "8", "18"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => field.onChange(d)}
                    className={cn(
                      "rounded-lg border-2 p-3 text-left transition-all hover:border-primary/60",
                      field.value === d
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <p className="text-lg font-bold font-mono">{d}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {d === "6" && "Stablecoin"}
                      {d === "8" && "Commodity"}
                      {d === "18" && "Standard ERC-20"}
                    </p>
                  </button>
                ))}
              </div>
              {decimals && (
                <FormDescription className="flex items-start gap-1.5 mt-2">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {DECIMAL_DESCRIPTIONS[decimals]}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* ── Cap structure ── */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">Cap Structure</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Optional soft and hard caps for the offering in {currency}.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="softCap"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Soft Cap (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`e.g. 1000000`}
                      type="number"
                      min="0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Minimum raise to proceed.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hardCap"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hard Cap (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`e.g. 10000000`}
                      type="number"
                      min="0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Maximum raise ceiling.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* ── Treasury ── */}
        <FormField
          control={form.control}
          name="treasuryAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Treasury Address <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="0x..."
                  className="font-mono text-xs"
                  {...field}
                />
              </FormControl>
              <FormDescription className="flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Operational wallet that receives and distributes minted tokens.
                Stored as <code className="text-xs bg-muted px-1 py-0.5 rounded">treasury</code>{" "}
                on BaseAssetToken. Recommend a multisig.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* ── Proof of Backing ── */}
        <Card className={cn(enableBacking ? "border-primary/40" : "")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Proof of Backing / Reserve
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Plug in an <code className="bg-muted px-1 rounded text-[11px]">IBackingVerifier</code>{" "}
                  contract for on-chain proof of reserve.
                </CardDescription>
              </div>
              <FormField
                control={form.control}
                name="enableBacking"
                render={({ field }) => (
                  <FormItem>
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
          </CardHeader>

          {enableBacking && (
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md p-2.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  The verifier contract must implement{" "}
                  <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">
                    IBackingVerifier
                  </code>
                  . If set to <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">address(0)</code>,
                  backing verification is disabled.
                </span>
              </div>
              <FormField
                control={form.control}
                name="backingVerifierAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Backing Verifier Contract Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0x..."
                        className="font-mono text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          )}
        </Card>

        {/* ── Actions ── */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button type="submit" size="lg">
            Continue to Documents
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
