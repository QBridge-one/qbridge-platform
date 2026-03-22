// ============================================================
// lib/validators/asset-wizard.ts
// Zod schemas for each step of the asset creation wizard
// ============================================================

import { z } from "zod";
import { ASSET_TYPES, JURISDICTIONS, KYC_TIERS, TRANSFER_MODES } from "@/types/assets";

const jurisdictionValues = JURISDICTIONS.map((j) => j.value) as [
  string,
  ...string[]
];

// ─── Step 1: Asset Details ────────────────────────────────────
export const assetDetailsSchema = z.object({
  name: z
    .string()
    .min(3, "Asset name must be at least 3 characters")
    .max(100, "Asset name must be under 100 characters"),
  symbol: z
    .string()
    .min(2, "Symbol must be at least 2 characters")
    .max(12, "Symbol must be under 12 characters")
    .regex(/^[A-Z0-9]+$/, "Symbol must be uppercase letters and numbers only"),
  assetType: z.enum(ASSET_TYPES, {
    message: "Please select a valid asset type",
  }),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(2000, "Description must be under 2000 characters"),
  jurisdiction: z.enum(jurisdictionValues as [string, ...string[]], {
    message: "Please select a jurisdiction",
  }),
  issuerLegalName: z
    .string()
    .min(2, "Legal entity name is required")
    .max(200, "Legal name must be under 200 characters"),
  issuerWallet: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address"),
  websiteUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

export type AssetDetailsSchema = z.infer<typeof assetDetailsSchema>;

// ─── Step 2: Token Configuration ─────────────────────────────
export const tokenConfigSchema = z
  .object({
    tokenStandard: z.literal("ERC20_SECURITY"),
    totalSupply: z
      .string()
      .min(1, "Total supply is required")
      .refine(
        (v) => !isNaN(Number(v)) && Number(v) > 0,
        "Must be a positive number"
      ),
    pricePerToken: z
      .string()
      .min(1, "Price per token is required")
      .refine(
        (v) => !isNaN(Number(v)) && Number(v) > 0,
        "Must be a positive number"
      ),
    currency: z.enum(["USD", "CAD", "EUR", "USDC"]),
    decimals: z.enum(["6", "8", "18"]),
    softCap: z.string().optional(),
    hardCap: z.string().optional(),
    treasuryAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address"),
    enableBacking: z.boolean(),
    backingVerifierAddress: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.enableBacking && !data.backingVerifierAddress) return false;
      if (
        data.backingVerifierAddress &&
        !/^0x[a-fA-F0-9]{40}$/.test(data.backingVerifierAddress)
      )
        return false;
      return true;
    },
    {
      message: "Backing verifier address is required when backing is enabled",
      path: ["backingVerifierAddress"],
    }
  )
  .refine(
    (data) => {
      if (data.softCap && data.hardCap) {
        return Number(data.softCap) <= Number(data.hardCap);
      }
      return true;
    },
    {
      message: "Soft cap must be less than or equal to hard cap",
      path: ["softCap"],
    }
  );

export type TokenConfigSchema = z.infer<typeof tokenConfigSchema>;

// ─── Step 3: Documents ────────────────────────────────────────
export const documentsSchema = z.object({
  spvEntityName: z.string().optional(),
  spvJurisdiction: z.string().optional(),
  regulatoryExemption: z.string().optional(),
  // File fields are validated separately in the component
  // since Zod doesn't handle File objects well in all environments
});

export type DocumentsSchema = z.infer<typeof documentsSchema>;

// ─── Step 4: Compliance Rules ─────────────────────────────────
const kycTierValues = KYC_TIERS.map((k) => k.value) as [string, ...string[]];
const transferModeValues = TRANSFER_MODES.map((t) => t.value) as [
  string,
  ...string[]
];

export const complianceSchema = z
  .object({
    kycTier: z.enum(kycTierValues as [string, ...string[]], {
      message: "Please select a KYC tier",
    }),
    transferMode: z.enum(transferModeValues as [string, ...string[]], {
      message: "Please select a transfer mode",
    }),
    holdPeriodDays: z.number().min(0).max(3650).optional(),
    maxInvestors: z.number().min(1).max(99999).optional(),
    minInvestmentAmount: z.string().optional(),
    maxInvestmentAmount: z.string().optional(),
    allowedJurisdictions: z.array(z.string()),
    blockedJurisdictions: z.array(z.string()),
    enableProofOfBacking: z.boolean(),
    requireAccreditedStatus: z.boolean(),
    complianceCheckerAddress: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.complianceCheckerAddress) {
        return /^0x[a-fA-F0-9]{40}$/.test(data.complianceCheckerAddress);
      }
      return true;
    },
    {
      message: "Must be a valid Ethereum address",
      path: ["complianceCheckerAddress"],
    }
  )
  .refine(
    (data) => {
      if (data.transferMode === "HOLD_PERIOD") {
        return data.holdPeriodDays !== undefined && data.holdPeriodDays > 0;
      }
      return true;
    },
    {
      message: "Hold period days required when transfer mode is Hold Period",
      path: ["holdPeriodDays"],
    }
  );

export type ComplianceSchema = z.infer<typeof complianceSchema>;
