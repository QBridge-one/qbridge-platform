"use client";

// ============================================================
// app/workspace/assets/new/_components/fields.tsx
//
// Small typed field primitives bound to the createDeal wizard form
// (DealWizardValues). They read `control` from FormProvider context so
// step components stay concise. `name` accepts nested array paths
// (e.g. "classes.0.subTiers.1.label").
// ============================================================

import { useFormContext } from "react-hook-form";
import type { FieldPath } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { DealWizardValues } from "@/lib/validators/deal-wizard";

type Name = FieldPath<DealWizardValues>;

interface BaseProps {
  name: Name;
  label: string;
  description?: React.ReactNode;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

function Req() {
  return <span className="text-destructive">*</span>;
}

/** Plain text input. */
export function TextField({
  name,
  label,
  description,
  placeholder,
  className,
  required,
  mono,
}: BaseProps & { mono?: boolean }) {
  const { control } = useFormContext<DealWizardValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label} {required && <Req />}
          </FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              className={cn(mono && "font-mono text-xs")}
              {...field}
              value={(field.value as string) ?? ""}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** 0x-address input (monospace). */
export function AddressField(props: BaseProps) {
  return <TextField {...props} mono placeholder={props.placeholder ?? "0x..."} />;
}

/** Numeric (uint) input kept as a string; optional unit suffix. */
export function NumberField({
  name,
  label,
  description,
  placeholder,
  className,
  required,
  suffix,
}: BaseProps & { suffix?: string }) {
  const { control } = useFormContext<DealWizardValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label} {required && <Req />}
          </FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                inputMode="numeric"
                placeholder={placeholder ?? "0"}
                className={cn("font-mono", suffix && "pr-16")}
                {...field}
                value={(field.value as string) ?? ""}
              />
              {suffix && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {suffix}
                </span>
              )}
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** Multi-line text. */
export function TextAreaField({
  name,
  label,
  description,
  placeholder,
  className,
  required,
}: BaseProps) {
  const { control } = useFormContext<DealWizardValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label} {required && <Req />}
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              className="min-h-[90px] resize-y"
              {...field}
              value={(field.value as string) ?? ""}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** Boolean toggle laid out as a labelled row. */
export function SwitchField({
  name,
  label,
  description,
}: Omit<BaseProps, "placeholder">) {
  const { control } = useFormContext<DealWizardValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between gap-4 rounded-md border p-3">
          <div className="space-y-0.5">
            <FormLabel>{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormControl>
            <Switch
              checked={Boolean(field.value)}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

/** Section heading used inside step cards. */
export function SectionTitle({
  title,
  hint,
}: {
  title: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
