// ============================================================
// lib/validators/tokenized-deposit-wizard.ts
//
// Zod schema for the (scaffolded) "Issue deposit token" wizard. Mirrors the
// stablecoin wizard (lib/validators/stablecoin-wizard.ts): numeric inputs are
// kept as strings, one flat schema drives a single react-hook-form, and
// STEP_FIELDS gates per-step navigation.
//
// A tokenized deposit differs from a stablecoin in POLICY, not plumbing — so
// there is no proof-of-reserves step (a deposit is a bank liability settled
// 1:1 against the core ledger, not a reserve-backed instrument). Instead the
// wizard collects the transfer policy (allowlist by default), jurisdiction,
// and the core-ledger settlement wiring.
// ============================================================

import { z } from "zod";

const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address");

/** Empty string OR a valid 0x address (settlement adapter is optional at scaffold time). */
const optionalAddressSchema = z
  .string()
  .regex(/^$|^0x[a-fA-F0-9]{40}$/, "Must be empty or a valid 0x address");

/** Non-negative integer string (uint). */
const uintStr = (msg = "Must be a non-negative integer") =>
  z.string().regex(/^\d+$/, msg);

export const tokenizedDepositWizardSchema = z.object({
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
  currency: z.string().min(1, "Currency is required"),
  description: z.string().min(20, "Add a short description (≥20 chars)").max(2000),

  // Step 2 — Compliance & transfer
  transferPolicy: z.enum(["0", "1"], { message: "Choose a transfer policy" }),
  jurisdiction: z.string().min(2, "Enter the primary jurisdiction"),

  // Step 3 — Settlement & governance
  coreLedgerAccount: z.string().min(2, "Enter the core-ledger account reference"),
  settlementAdapter: optionalAddressSchema,
  issuerAdmin: addressSchema,
  timelockMinDelay: uintStr("Timelock delay (seconds) must be a whole number"),
});

export type TokenizedDepositWizardValues = z.infer<typeof tokenizedDepositWizardSchema>;

export const STEP_FIELDS: Record<number, (keyof TokenizedDepositWizardValues)[]> = {
  1: ["name", "symbol", "decimals", "currency", "description"],
  2: ["transferPolicy", "jurisdiction"],
  3: ["coreLedgerAccount", "settlementAdapter", "issuerAdmin", "timelockMinDelay"],
};
