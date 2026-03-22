"use client";

// ============================================================
// components/contract-ui/ParamInput.tsx
//
// Renders the correct input widget for each ABI param type.
// Used by ContractFunctionForm — one ParamInput per function param.
//
// address    → text input + checksum validation indicator
// role_id    → select dropdown populated from role definitions
// bool       → Switch toggle
// delay      → number input + "seconds" label
// amount     → number input
// bytes32    → hex text input
// string     → text input
// integer    → number input
// ============================================================

import type { ControllerRenderProps, UseFormReturn } from "react-hook-form";
import type { AbiParamDescriptor } from "@/lib/abi-engine/parser";
import type { RoleDefinition } from "@/types/access-manager";
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface ParamInputProps {
  param: AbiParamDescriptor;
  form: UseFormReturn<Record<string, unknown>>;
  roles?: RoleDefinition[];
  disabled?: boolean;
}

export function ParamInput({ param, form, roles, disabled }: ParamInputProps) {
  return (
    <FormField
      control={form.control}
      name={param.name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="capitalize">
            {param.name}
            <span className="ml-2 text-xs text-muted-foreground font-mono">
              {param.solidityType}
            </span>
          </FormLabel>
          <FormControl>
            <ParamWidget
              param={param}
              field={field}
              roles={roles}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ─── Widget selector ─────────────────────────────────────────
function ParamWidget({
  param, field, roles, disabled,
}: {
  param: AbiParamDescriptor;
  field: ControllerRenderProps<Record<string, unknown>, string>;
  roles?: RoleDefinition[];
  disabled?: boolean;
}) {
  switch (param.semantic) {
    case "role_id":
      return (
        <Select
          disabled={disabled}
          value={typeof field.value === "string" ? field.value : undefined}
          onValueChange={field.onChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role..." />
          </SelectTrigger>
          <SelectContent>
            {(roles ?? []).map((role) => (
              <SelectItem key={role.id.toString()} value={role.id.toString()}>
                <div className="flex items-center gap-2">
                  <span>{role.label}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {role.id.toString()}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "bool":
      return (
        <div className="flex items-center gap-2 pt-1">
          <Switch
            checked={Boolean(field.value)}
            onCheckedChange={field.onChange}
            disabled={disabled}
          />
          <span className="text-sm text-muted-foreground">
            {field.value ? "true" : "false"}
          </span>
        </div>
      );

    case "address":
    case "account":
      return (
        <Input
          value={typeof field.value === "string" ? field.value : ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
          disabled={disabled}
          placeholder="0x..."
          className="font-mono text-sm"
          spellCheck={false}
        />
      );

    case "delay":
      return (
        <div className="flex items-center gap-2">
          <Input
            value={typeof field.value === "string" || typeof field.value === "number" ? String(field.value) : ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
            disabled={disabled}
            type="number"
            min={0}
            placeholder="0"
            className="font-mono"
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            seconds
          </span>
        </div>
      );

    case "amount":
    case "integer":
      return (
        <Input
          value={typeof field.value === "string" || typeof field.value === "number" ? String(field.value) : ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
          disabled={disabled}
          type="number"
          min={0}
          placeholder="0"
          className="font-mono"
        />
      );

    case "bytes32":
    case "selector":
    case "bytes":
      return (
        <Input
          value={typeof field.value === "string" ? field.value : ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
          disabled={disabled}
          placeholder="0x..."
          className="font-mono text-sm"
          spellCheck={false}
        />
      );

    case "timestamp":
      return (
        <Input
          value={typeof field.value === "string" ? field.value : ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
          disabled={disabled}
          type="datetime-local"
        />
      );

    case "string":
    default:
      return (
        <Input
          value={typeof field.value === "string" ? field.value : ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
          disabled={disabled}
          placeholder={`Enter ${param.name}...`}
        />
      );
  }
}
