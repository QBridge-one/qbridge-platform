"use client";

// ============================================================
// Step 3 — Share Classes & Caps
// Dynamic editor for tokenParams.classes[] (each with subTiers[]),
// the global mint cap, unit price, and the optional combined cap.
// ============================================================

import { useFormContext, useFieldArray } from "react-hook-form";
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
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Layers, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { NumberField, TextField, SwitchField, SectionTitle } from "./fields";
import { SHARE_CLASSES, shareClassLabel, SHARE_CLASS_B } from "@/types/deal";
import type { DealWizardValues } from "@/lib/validators/deal-wizard";

// tierId ≥ 1; splits must sum to 10000 bps. Defaults are valid out of the
// box so a fresh Class A/AA satisfies the on-chain "≥1 sub-tier" rule.
const newSubTier = () => ({
  tierId: "1",
  label: "Tier 1",
  minimumCommitment: "0",
  classSplitBps: "5000",
  classBSplitBps: "5000",
});

const newClass = () => ({
  shareClass: 1, // Class A (0 = None is invalid)
  classMintCap: "",
  subscribable: true,
  managerMintOnly: false,
  holdPeriodDays: "0",
  subTiers: [newSubTier()],
});

export function StepClasses() {
  const { control } = useFormContext<DealWizardValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "classes" });

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <SectionTitle title="Supply & Pricing" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            name="globalMintCap"
            label="Global Mint Cap"
            required
            description="Maximum total tokens mintable across all classes (base units)."
          />
          <NumberField
            name="unitPriceAtIssuance"
            label="Unit Price at Issuance"
            required
            suffix="cents"
            description="Reference price per unit at issuance, in cents."
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle title="Share Classes" hint="At least one. Each class may have sub-tiers." />
          <Button type="button" variant="outline" size="sm" onClick={() => append(newClass())}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add class
          </Button>
        </div>

        {fields.length === 0 && (
          <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            No share classes yet. Add at least one to continue.
          </p>
        )}

        <div className="space-y-4">
          {fields.map((f, i) => (
            <ClassCard key={f.id} index={i} onRemove={() => remove(i)} canRemove={fields.length > 1} />
          ))}
        </div>
      </div>

      <CombinedCapSection />
    </div>
  );
}

// ─── One share class (with its own subTiers field array) ──────
function ClassCard({
  index,
  onRemove,
  canRemove,
}: {
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { control, watch, setValue } = useFormContext<DealWizardValues>();
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: `classes.${index}.subTiers` as const,
  });

  const isClassB = watch(`classes.${index}.shareClass`) === SHARE_CLASS_B;

  // Class B = manager carry/promote class: not subscribable, manager-mint-only,
  // no sub-tiers (enforced on-chain in SingleSpvRealEstateTokenLib).
  const onShareClassChange = (v: string) => {
    const n = Number(v);
    setValue(`classes.${index}.shareClass`, n, { shouldValidate: true });
    if (n === SHARE_CLASS_B) {
      setValue(`classes.${index}.subscribable`, false, { shouldValidate: true });
      setValue(`classes.${index}.managerMintOnly`, true, { shouldValidate: true });
      replace([]);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Class #{index + 1}</span>
          </div>
          {canRemove && (
            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={onRemove}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name={`classes.${index}.shareClass` as const}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Share Class</FormLabel>
                <Select
                  value={String(field.value)}
                  onValueChange={onShareClassChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SHARE_CLASSES.map((c) => (
                      <SelectItem key={c.value} value={String(c.value)}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <NumberField name={`classes.${index}.classMintCap` as const} label="Class Mint Cap" required />
          <NumberField
            name={`classes.${index}.holdPeriodDays` as const}
            label="Hold Period"
            required
            suffix="days"
          />
        </div>

        {isClassB ? (
          <div className="flex items-start gap-2 rounded-md border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <strong>Class B is the manager carry / promote class.</strong> It&apos;s
              not subscribable, is manager-mint-only, and has no sub-tiers — units are
              issued later by the manager via <code>issueClassB</code>. These are set
              automatically.
            </span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SwitchField
                name={`classes.${index}.subscribable` as const}
                label="Subscribable"
                description="Open to investor subscription."
              />
              <SwitchField
                name={`classes.${index}.managerMintOnly` as const}
                label="Manager Mint Only"
                description="Only the manager can mint this class."
              />
            </div>

            {/* Sub-tiers */}
            <div className="space-y-3 rounded-md border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Sub-tiers</span>
            <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => append(newSubTier())}>
              <Plus className="mr-1 h-3 w-3" />
              Add sub-tier
            </Button>
          </div>

          {fields.length === 0 && (
            <p className="text-xs text-destructive">
              At least one sub-tier is required for Class A / AA.
            </p>
          )}

          {fields.map((t, j) => (
            <div key={t.id} className={cn("space-y-3 rounded-md border bg-background p-3")}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Sub-tier #{j + 1}</span>
                <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-destructive" onClick={() => remove(j)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <NumberField name={`classes.${index}.subTiers.${j}.tierId` as const} label="Tier ID" />
                <TextField name={`classes.${index}.subTiers.${j}.label` as const} label="Label" placeholder="e.g. Tier 1" />
                <NumberField name={`classes.${index}.subTiers.${j}.minimumCommitment` as const} label="Minimum Commitment" />
                <NumberField name={`classes.${index}.subTiers.${j}.classSplitBps` as const} label="Class Split" suffix="bps" />
                <NumberField name={`classes.${index}.subTiers.${j}.classBSplitBps` as const} label="Class B Split" suffix="bps" />
              </div>
            </div>
          ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Combined cap (optional, across selected classes) ─────────
function CombinedCapSection() {
  const { watch, setValue } = useFormContext<DealWizardValues>();
  const enabled = watch("combinedCapEnabled");
  const selected = watch("combinedCapClasses") ?? [];

  const toggleClass = (value: number) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    setValue("combinedCapClasses", next, { shouldValidate: true });
  };

  return (
    <div className="space-y-4">
      <SwitchField
        name="combinedCapEnabled"
        label="Combined Cap"
        description="Enforce a shared mint cap across several classes."
      />
      {enabled && (
        <div className="space-y-4 rounded-md border p-4">
          <NumberField name="combinedCap" label="Combined Cap" required description="Shared cap across the selected classes." />
          <div className="space-y-2">
            <p className="text-sm font-medium leading-none">Applicable Classes</p>
            <div className="flex flex-wrap gap-2">
              {SHARE_CLASSES.map((c) => {
                const on = selected.includes(c.value);
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => toggleClass(c.value)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                      on
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {shareClassLabel(c.value)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
