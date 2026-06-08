// ============================================================
// lib/validators/deal-wizard.ts
//
// Zod schema for the full createDeal wizard. Form values are kept as
// strings for numeric inputs (text fields) and coerced to on-chain
// types by buildDealConfig() in lib/contracts/factory-payload.ts.
//
// One flat object schema drives a single react-hook-form instance;
// STEP_FIELDS lists which field paths each step validates so the page
// can gate navigation with form.trigger(STEP_FIELDS[step]).
// ============================================================

import { z } from "zod";

// ─── Reusable field schemas ───────────────────────────────────
const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address");

const bytes32Schema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Must be 32-byte hex (0x + 64 chars)");

/** Non-negative integer string (uint). */
const uintStr = (msg = "Must be a non-negative integer") =>
  z.string().regex(/^\d+$/, msg);

/** Positive integer string (> 0). */
const positiveStr = (msg = "Must be a positive integer") =>
  z.string().regex(/^\d+$/, msg).refine((v) => BigInt(v) > BigInt(0), msg);

/** Basis-points string, 0–10000. */
const bpsStr = z
  .string()
  .regex(/^\d+$/, "Must be a whole number")
  .refine((v) => Number(v) <= 10000, "Cannot exceed 10000 bps (100%)");

// ─── Sub-tier (within a share class) ──────────────────────────
// tierId ≥ 1 (0 = InvalidSubTierId) and the two splits must sum to 10000
// (SubTierSplitsMustSumTo10000).
export const subTierSchema = z
  .object({
    tierId: z
      .string()
      .regex(/^\d+$/, "Tier id must be a whole number")
      .refine((v) => Number(v) >= 1, "Tier id must be 1 or greater"),
    label: z.string().min(1, "Label is required").max(64, "Label too long"),
    minimumCommitment: uintStr("Minimum commitment must be a whole number"),
    classSplitBps: bpsStr,
    classBSplitBps: bpsStr,
  })
  .refine((t) => Number(t.classSplitBps) + Number(t.classBSplitBps) === 10000, {
    message: "Class split + Class B split must sum to 10000 bps",
    path: ["classBSplitBps"],
  });

// ─── Share class ──────────────────────────────────────────────
// shareClass must be 1/2/3 (A/AA/B); 0 = None is rejected on-chain
// (ClassConfigNoneShareClass). Subscribable classes require ≥1 sub-tier
// (SubscribableClassRequiresSubTiers).
export const shareClassSchema = z
  .object({
    shareClass: z.number().int().min(1, "Pick a share class").max(255),
    classMintCap: uintStr("Class mint cap must be a whole number"),
    subscribable: z.boolean(),
    managerMintOnly: z.boolean(),
    holdPeriodDays: z
      .string()
      .regex(/^\d+$/, "Hold period (days) must be a whole number")
      .refine((v) => Number(v) <= 65535, "Cannot exceed 65535 days"),
    subTiers: z.array(subTierSchema),
  })
  .superRefine((c, ctx) => {
    if (c.shareClass === 3) {
      // Class B = manager carry/promote class.
      if (c.subscribable)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["subscribable"], message: "Class B cannot be subscribable" });
      if (!c.managerMintOnly)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["managerMintOnly"], message: "Class B must be manager-mint-only" });
      if (c.subTiers.length > 0)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["subTiers"], message: "Class B cannot have sub-tiers" });
    } else if (c.subTiers.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["subTiers"], message: "Class A / AA need at least one sub-tier" });
    }
  });

// ─── Full wizard schema ───────────────────────────────────────
export const dealWizardSchema = z.object({
  // Step 1 — Asset & Token
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  symbol: z
    .string()
    .min(2, "Symbol must be at least 2 characters")
    .max(12, "Symbol must be under 12 characters")
    .regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
  decimals: z
    .string()
    .regex(/^\d+$/, "Decimals must be a whole number")
    .refine((v) => Number(v) <= 18, "Decimals cannot exceed 18"),
  description: z.string().min(20, "Add a short description (≥20 chars)").max(2000),
  dealMetadataURI: z.string().max(400).optional().or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  assetType: z.string().min(1, "Asset type is required"),
  salt: bytes32Schema,

  // Step 2 — Roles & Treasury
  dealAdmin: addressSchema,
  platformProposer: addressSchema,
  issuerExecutor: addressSchema,
  treasury: addressSchema,
  spvLegalEntity: addressSchema,
  timelockMinDelay: uintStr("Timelock delay (seconds) must be a whole number"),

  // Step 3 — Share Classes & Caps
  globalMintCap: uintStr("Global mint cap must be a whole number"),
  unitPriceAtIssuance: uintStr("Unit price must be a whole number (cents)"),
  classes: z.array(shareClassSchema).min(1, "Add at least one share class"),
  combinedCapEnabled: z.boolean(),
  combinedCap: uintStr("Combined cap must be a whole number"),
  // No None (0) — CombinedCapNoneShareClass on-chain.
  combinedCapClasses: z.array(z.number().int().min(1, "Invalid share class")),

  // Step 4 — Valuation (NAV oracle)
  maxNavChangeBps: bpsStr,
  stalenessWarningSeconds: uintStr("Staleness window (seconds) must be a whole number"),
  navPerUnitCents: positiveStr("Initial NAV per unit (cents) must be > 0"),
  asOfTimestamp: positiveStr("As-of timestamp (unix seconds) must be > 0"),
  reportURI: z.string().max(400).optional().or(z.literal("")),
  reportURIHash: z
    .union([bytes32Schema, z.literal("")])
    .optional(),
  methodologyNote: z.string().max(1000).optional().or(z.literal("")),

  // Step 5 — Compliance
  accreditationValidity: uintStr("Accreditation validity (seconds) must be a whole number"),
  holdPeriodClassA: uintStr("Hold period Class A (seconds) must be a whole number"),
  holdPeriodClassAA: uintStr("Hold period Class AA (seconds) must be a whole number"),

  // Step 6 — Distributions & Capital Calls
  calculator: addressSchema,
  executionGracePeriod: uintStr("Grace period (seconds) must be a whole number"),
});

export type DealWizardValues = z.infer<typeof dealWizardSchema>;

// ─── Per-step field paths (for form.trigger gating) ───────────
export const STEP_FIELDS: Record<number, (keyof DealWizardValues)[]> = {
  1: ["name", "symbol", "decimals", "description", "dealMetadataURI", "category", "assetType", "salt"],
  2: ["dealAdmin", "platformProposer", "issuerExecutor", "treasury", "spvLegalEntity", "timelockMinDelay"],
  3: ["globalMintCap", "unitPriceAtIssuance", "classes", "combinedCapEnabled", "combinedCap", "combinedCapClasses"],
  4: ["maxNavChangeBps", "stalenessWarningSeconds", "navPerUnitCents", "asOfTimestamp", "reportURI", "reportURIHash", "methodologyNote"],
  5: ["accreditationValidity", "holdPeriodClassA", "holdPeriodClassAA"],
  6: ["calculator", "executionGracePeriod"],
};
