"use client";

// ============================================================
// app/workspace/tokenized-deposits/new/_components/fields.tsx
//
// Typed field primitives bound to the (scaffolded) issue-deposit wizard form
// (TokenizedDepositWizardValues). Deposit-local clone of the stablecoin
// wizard's fields.tsx — same primitives, retyped to the deposit values.
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
import { cn } from "@/lib/utils";
import type { TokenizedDepositWizardValues } from "@/lib/validators/tokenized-deposit-wizard";

type Name = FieldPath<TokenizedDepositWizardValues>;

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

export function TextField({
  name,
  label,
  description,
  placeholder,
  className,
  required,
  mono,
}: BaseProps & { mono?: boolean }) {
  const { control } = useFormContext<TokenizedDepositWizardValues>();
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

export function AddressField(props: BaseProps) {
  return <TextField {...props} mono placeholder={props.placeholder ?? "0x..."} />;
}

export function NumberField({
  name,
  label,
  description,
  placeholder,
  className,
  required,
  suffix,
}: BaseProps & { suffix?: string }) {
  const { control } = useFormContext<TokenizedDepositWizardValues>();
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

export function TextAreaField({
  name,
  label,
  description,
  placeholder,
  className,
  required,
}: BaseProps) {
  const { control } = useFormContext<TokenizedDepositWizardValues>();
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

export function SectionTitle({ title, hint }: { title: string; hint?: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
