// ============================================================
// lib/validators/stablecoin-wizard.ts
//
// Zod schema for the createStablecoin wizard. Numeric inputs are kept as
// strings and coerced to on-chain types by buildStablecoinConfig() in
// lib/contracts/stablecoin-payload.ts. One flat schema drives a single
// react-hook-form; STEP_FIELDS gates per-step navigation.
// ============================================================

import { z } from "zod";

const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address");

const bytes32Schema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Must be 32-byte hex (0x + 64 chars)");

/** Non-negative integer string (uint). */
const uintStr = (msg = "Must be a non-negative integer") =>
  z.string().regex(/^\d+$/, msg);

/** Basis-points string, 0–10000. */
const bpsStr = z
  .string()
  .regex(/^\d+$/, "Must be a whole number")
  .refine((v) => Number(v) <= 10000, "Cannot exceed 10000 bps (100%)");

export const stablecoinWizardSchema = z.object({
  // Step 1 — Token basics
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  symbol: z
    .string()
    .min(2, "Symbol must be at least 2 characters")
    .max(12, "Symbol must be under 12 characters")
    .regex(/^[A-Za-z0-9]+$/, "Letters and numbers only"),
  decimals: z
    .string()
    .regex(/^\d+$/, "Decimals must be a whole number")
    .refine((v) => Number(v) <= 18, "Decimals cannot exceed 18"),
  description: z.string().min(20, "Add a short description (≥20 chars)").max(2000),
  category: z.string().min(1, "Category is required"),
  assetType: z.string().min(1, "Asset type is required"),
  treasury: addressSchema,
  globalMintCap: uintStr("Global mint cap must be a whole number (0 = unlimited at base)"),
  salt: bytes32Schema,

  // Step 2 — Proof-of-reserves
  maxReserveAttestationAge: uintStr("Freshness window (seconds) must be a whole number"),
  maxReserveChangeBps: bpsStr,
  stalenessWarningSeconds: uintStr("Staleness warning (seconds) must be a whole number"),

  // Step 3 — Roles & governance
  dealAdmin: addressSchema,
  platformProposer: addressSchema,
  issuerExecutor: addressSchema,
  timelockMinDelay: uintStr("Timelock delay (seconds) must be a whole number"),
});

export type StablecoinWizardValues = z.infer<typeof stablecoinWizardSchema>;

export const STEP_FIELDS: Record<number, (keyof StablecoinWizardValues)[]> = {
  1: ["name", "symbol", "decimals", "description", "category", "assetType", "treasury", "globalMintCap", "salt"],
  2: ["maxReserveAttestationAge", "maxReserveChangeBps", "stalenessWarningSeconds"],
  3: ["dealAdmin", "platformProposer", "issuerExecutor", "timelockMinDelay"],
};
