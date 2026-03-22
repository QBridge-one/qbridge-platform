"use client";

// ============================================================
// app/dashboard/assets/new/_components/step-asset-details.tsx
// Step 1 — Asset name, type, jurisdiction, issuer info
// ============================================================

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assetDetailsSchema, type AssetDetailsSchema } from "@/lib/validators/asset-wizard";
import {
  ASSET_TYPES,
  ASSET_TYPE_LABELS,
  ASSET_TYPE_DESCRIPTIONS,
  JURISDICTIONS,
} from "@/types/assets";
import type { AssetDetailsFormData } from "@/types/assets";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Building2, Landmark, Wheat, Coins, ArrowRight, Info } from "lucide-react";
import type { AssetType } from "@/types/assets";

const ASSET_TYPE_ICONS: Record<AssetType, React.ElementType> = {
  REAL_ESTATE: Building2,
  PRIVATE_CREDIT: Landmark,
  COMMODITY: Wheat,
  STABLECOIN: Coins,
};

interface StepAssetDetailsProps {
  defaultValues?: Partial<AssetDetailsFormData>;
  onNext: (data: AssetDetailsFormData) => void;
}

export function StepAssetDetails({ defaultValues, onNext }: StepAssetDetailsProps) {
  const form = useForm<AssetDetailsSchema>({
    resolver: zodResolver(assetDetailsSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      symbol: defaultValues?.symbol ?? "",
      assetType: defaultValues?.assetType ?? undefined,
      description: defaultValues?.description ?? "",
      jurisdiction: defaultValues?.jurisdiction ?? undefined,
      issuerLegalName: defaultValues?.issuerLegalName ?? "",
      issuerWallet: defaultValues?.issuerWallet ?? "",
      websiteUrl: defaultValues?.websiteUrl ?? "",
    },
  });

  const selectedType = form.watch("assetType");

  const onSubmit = (data: AssetDetailsSchema) => {
    onNext(data as AssetDetailsFormData);
  };

  // Auto-uppercase symbol
  const handleSymbolChange = (value: string) => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* ── Asset Type Selector ── */}
        <FormField
          control={form.control}
          name="assetType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                Asset Type <span className="text-destructive">*</span>
              </FormLabel>
              <FormDescription>
                Select the category that best describes your real-world asset.
              </FormDescription>
              <FormControl>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mt-2">
                  {ASSET_TYPES.map((type) => {
                    const Icon = ASSET_TYPE_ICONS[type];
                    const isSelected = field.value === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => field.onChange(type)}
                        className={cn(
                          "flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all duration-150 hover:border-primary/60 hover:bg-accent",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-background"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-md",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-tight">
                            {ASSET_TYPE_LABELS[type]}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                            {ASSET_TYPE_DESCRIPTIONS[type]}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Asset Name + Symbol ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Asset Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Toronto Commercial Tower"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The full legal or marketing name of the tokenized asset.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="symbol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Token Symbol <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. TCT"
                    {...field}
                    onChange={(e) =>
                      field.onChange(handleSymbolChange(e.target.value))
                    }
                    maxLength={12}
                    className="font-mono"
                  />
                </FormControl>
                <FormDescription>Uppercase, max 12 chars.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ── Description ── */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Description <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the asset, its backing, and what investors are acquiring..."
                  className="min-h-[120px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Min 50 characters. This appears on the public launchpad listing.
                {field.value?.length > 0 && (
                  <span
                    className={cn(
                      "ml-2",
                      field.value.length < 50 ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {field.value.length} / 2000
                  </span>
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Jurisdiction ── */}
        <FormField
          control={form.control}
          name="jurisdiction"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Primary Jurisdiction <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select regulatory jurisdiction" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {JURISDICTIONS.map((j) => (
                    <SelectItem key={j.value} value={j.value}>
                      {j.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Determines which compliance rules and exemptions apply to this offering.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Issuer Info ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Issuer Information</h3>
            <Badge variant="outline" className="text-[10px]">KYB Verified</Badge>
          </div>

          <Card className="bg-muted/40 border-dashed">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2 text-xs text-muted-foreground mb-4">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  Issuer wallet will receive <strong>ADMIN_ROLE (id: 0)</strong> on
                  the deployed TokenAccessManager. This address controls all token
                  operations. Use a hardware wallet or multisig.
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="issuerLegalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Legal Entity Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Acme Capital Ltd." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="issuerWallet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Issuer Wallet Address <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0x..."
                          className="font-mono text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Receives ADMIN_ROLE on deployment.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Website (optional) ── */}
        <FormField
          control={form.control}
          name="websiteUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Actions ── */}
        <div className="flex justify-end">
          <Button type="submit" size="lg">
            Continue to Token Config
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
