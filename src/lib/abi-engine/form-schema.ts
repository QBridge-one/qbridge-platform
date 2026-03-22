// ============================================================
// lib/abi-engine/form-schema.ts
//
// Converts an ABI function descriptor into a zod schema.
// The schema is used by react-hook-form to validate the form
// before it reaches the transaction pipeline.
//
// Each Solidity type maps to the right zod validator automatically.
// Role IDs get a string enum of valid role IDs from the config.
// ============================================================

import { z } from "zod";
import type { AbiParamDescriptor, AbiFunctionDescriptor } from "./parser";
import type { RoleDefinition } from "@/types/access-manager";

// ─── Schema builder ──────────────────────────────────────────
export function buildFormSchema(
  fn: AbiFunctionDescriptor,
  roles?: RoleDefinition[], // provided for role_id params
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const param of fn.inputs) {
    shape[param.name] = buildParamSchema(param, roles);
  }

  return z.object(shape);
}

function buildParamSchema(
  param: AbiParamDescriptor,
  roles?: RoleDefinition[],
): z.ZodTypeAny {
  switch (param.semantic) {
    case "role_id":
      // Role ID — string enum of valid role IDs (displayed as labels)
      // Value is stored as string, converted to bigint on submit
      if (roles && roles.length > 0) {
        const roleIds = roles.map((r) => r.id.toString()) as [string, ...string[]];
        return z.enum(roleIds, { message: "Select a valid role" });
      }
      return z.string().min(1, "Role ID required");

    case "address":
    case "account":
      return z
        .string()
        .min(1, "Address required")
        .regex(/^0x[0-9a-fA-F]{40}$/, "Invalid Ethereum address");

    case "delay":
      // Delay in seconds — displayed as human input (e.g. "2 days")
      // Stored as number, converted to uint32 on submit
      return z
        .string()
        .min(1, "Delay required")
        .refine(
          (v) => !isNaN(Number(v)) && Number(v) >= 0,
          "Delay must be a non-negative number",
        );

    case "amount":
      return z
        .string()
        .min(1, "Amount required")
        .refine(
          (v) => !isNaN(Number(v)) && Number(v) >= 0,
          "Amount must be a non-negative number",
        );

    case "timestamp":
      return z.string().min(1, "Timestamp required");

    case "bool":
      return z.boolean();

    case "string":
      return z.string();

    case "bytes32":
    case "selector":
    case "bytes":
      return z
        .string()
        .regex(/^0x[0-9a-fA-F]*$/, "Must be a valid hex string (0x...)");

    case "integer":
      return z
        .string()
        .min(1, "Value required")
        .refine(
          (v) => !isNaN(Number(v)),
          "Must be a valid number",
        );

    default:
      return z.string();
  }
}

// ─── Value converters ─────────────────────────────────────────
// Converts form string values to the correct ABI types before
// passing to the transaction pipeline.

export function convertFormValues(
  values: Record<string, unknown>,
  fn: AbiFunctionDescriptor,
): unknown[] {
  return fn.inputs.map((param) => {
    const raw = values[param.name];
    return convertValue(raw, param);
  });
}

function convertValue(raw: unknown, param: AbiParamDescriptor): unknown {
  const str = String(raw ?? "");

  switch (param.semantic) {
    case "role_id":
      // Convert string role ID back to bigint
      return BigInt(str);

    case "delay":
    case "integer":
      // uint32/uint64 → bigint if large, number if small
      return param.solidityType === "uint32" || param.solidityType === "uint8"
        ? Number(str)
        : BigInt(str);

    case "amount":
      return BigInt(str);

    case "bool":
      return Boolean(raw);

    case "address":
    case "account":
      return str as `0x${string}`;

    case "bytes32":
    case "selector":
    case "bytes":
      return str as `0x${string}`;

    case "timestamp":
      return BigInt(Math.floor(new Date(str).getTime() / 1000));

    default:
      return str;
  }
}
