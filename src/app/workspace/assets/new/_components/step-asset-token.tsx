"use client";

// ============================================================
// Step 1 — Asset & Token
// dealId/salt/category/assetType + token name/symbol/decimals/metadata.
// ============================================================

import { useFormContext } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { TextField, NumberField, TextAreaField, SectionTitle } from "./fields";
import { REAL_ESTATE_ASSET_TYPES, DEAL_CATEGORY } from "@/types/deal";
import { dealIdFromName, toBytes32Label, randomBytes32 } from "@/lib/contracts/factory-payload";
import type { DealWizardValues } from "@/lib/validators/deal-wizard";

export function StepAssetToken() {
  const { control, watch, setValue } = useFormContext<DealWizardValues>();
  const name = watch("name");
  const category = watch("category");
  const assetType = watch("assetType");
  const salt = watch("salt");

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField
          name="name"
          label="Deal / Asset Name"
          required
          className="sm:col-span-2"
          placeholder="e.g. Trinnium SA1 LLC"
          description="The on-chain dealId is keccak256(name)."
        />
        <TextField
          name="symbol"
          label="Token Symbol"
          required
          mono
          placeholder="TRSA1"
          description="Uppercase, ≤12 chars."
        />
      </div>

      <TextAreaField
        name="description"
        label="Description"
        required
        placeholder="Describe the property/SPV and what holders are acquiring…"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NumberField name="decimals" label="Decimals" required placeholder="18" />
        <TextField
          name="dealMetadataURI"
          label="Metadata URI"
          className="sm:col-span-2"
          placeholder="ipfs://… or https://… (optional)"
        />
      </div>

      <div className="space-y-4">
        <SectionTitle
          title="Classification"
          hint="Stored on-chain as bytes32 (keccak256 of the label)."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={DEAL_CATEGORY}>Real Estate</SelectItem>
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
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {REAL_ESTATE_ASSET_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Salt + computed bytes32 preview */}
      <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
        <div className="flex items-center justify-between">
          <SectionTitle title="CREATE2 Salt" hint="Randomised per deal for deterministic cluster addresses." />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setValue("salt", randomBytes32(), { shouldValidate: true })}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Regenerate
          </Button>
        </div>
        <TextField name="salt" label="Salt (bytes32)" mono />
        <dl className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
          <Row label="dealId" value={name ? dealIdFromName(name) : "—"} />
          <Row label="category" value={category ? toBytes32Label(category) : "—"} />
          <Row label="assetType" value={assetType ? toBytes32Label(assetType) : "—"} />
          <Row label="salt" value={salt || "—"} />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <dt className="w-20 shrink-0 font-medium">{label}</dt>
      <dd className="truncate font-mono">{value}</dd>
    </div>
  );
}
