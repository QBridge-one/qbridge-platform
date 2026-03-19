// ============================================================
// types/assets.ts
// Asset types, statuses, and form schemas for the RWA launchpad
// Aligned with BaseAssetToken.sol AssetType enum
// ============================================================

export const ASSET_TYPES = [
  "REAL_ESTATE",
  "PRIVATE_CREDIT",
  "COMMODITY",
  "STABLECOIN",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  REAL_ESTATE: "Real Estate",
  PRIVATE_CREDIT: "Private Credit / Bonds",
  COMMODITY: "Commodity / Fund",
  STABLECOIN: "Stablecoin",
};

export const ASSET_TYPE_DESCRIPTIONS: Record<AssetType, string> = {
  REAL_ESTATE:
    "Tokenized commercial or residential property with fractional ownership",
  PRIVATE_CREDIT:
    "Debt instruments, bonds, or structured credit facilities on-chain",
  COMMODITY: "Commodity-backed tokens including energy, agriculture, or funds",
  STABLECOIN: "Fiat-pegged or reserve-backed digital currency tokens",
};

// ─── Jurisdictions ───────────────────────────────────────────
export const JURISDICTIONS = [
  { value: "US", label: "United States (Reg D / Reg S)" },
  { value: "EU", label: "European Union (MiCA)" },
  { value: "CA", label: "Canada (NI 45-106)" },
  { value: "SG", label: "Singapore (MAS)" },
  { value: "GB", label: "United Kingdom (FCA)" },
  { value: "OTHER", label: "Other / Multi-Jurisdiction" },
] as const;

export type JurisdictionCode = (typeof JURISDICTIONS)[number]["value"];

// ─── Token Standards ─────────────────────────────────────────
export const TOKEN_STANDARDS = [
  {
    value: "ERC20_SECURITY",
    label: "Custom ERC-20 (Security Token)",
    description: "Your BaseAssetToken — compliance + freeze + force ops",
  },
] as const;

export type TokenStandard = (typeof TOKEN_STANDARDS)[number]["value"];

// ─── KYC Tiers ───────────────────────────────────────────────
export const KYC_TIERS = [
  { value: "NONE", label: "None — Public access" },
  { value: "BASIC", label: "Basic — Email verification" },
  { value: "KYC_1", label: "KYC Level 1 — ID verification" },
  { value: "KYC_2", label: "KYC Level 2 — Enhanced due diligence" },
  { value: "ACCREDITED", label: "Accredited Investor" },
  { value: "INSTITUTIONAL", label: "Institutional / Qualified Purchaser" },
] as const;

export type KycTier = (typeof KYC_TIERS)[number]["value"];

// ─── Transfer Restriction Modes ──────────────────────────────
export const TRANSFER_MODES = [
  {
    value: "WHITELIST_ONLY",
    label: "Whitelist Only",
    description: "Only approved addresses can send or receive",
  },
  {
    value: "JURISDICTION_LOCKED",
    label: "Jurisdiction Locked",
    description: "Transfers restricted to approved jurisdictions",
  },
  {
    value: "HOLD_PERIOD",
    label: "Lockup / Hold Period",
    description: "Tokens locked for a defined period after purchase",
  },
  {
    value: "OPEN",
    label: "Open (Compliance Only)",
    description: "Compliance checks only, no additional restrictions",
  },
] as const;

export type TransferMode = (typeof TRANSFER_MODES)[number]["value"];

// ─── Asset Status (platform lifecycle) ───────────────────────
export type AssetStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "DEPLOYING"
  | "LIVE"
  | "PAUSED"
  | "CLOSED";

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  DEPLOYING: "Deploying",
  LIVE: "Live",
  PAUSED: "Paused",
  CLOSED: "Closed",
};

// ─── Wizard Step Form Data ────────────────────────────────────

/** Step 1 — Asset Details */
export interface AssetDetailsFormData {
  name: string;
  symbol: string;
  assetType: AssetType;
  description: string;
  jurisdiction: JurisdictionCode;
  issuerLegalName: string;
  issuerWallet: string;
  websiteUrl?: string;
}

/** Step 2 — Token Configuration */
export interface TokenConfigFormData {
  tokenStandard: TokenStandard;
  totalSupply: string;
  pricePerToken: string;
  currency: "USD" | "CAD" | "EUR" | "USDC";
  decimals: "6" | "8" | "18";
  softCap?: string;
  hardCap?: string;
  treasuryAddress: string;
  enableBacking: boolean;
  backingVerifierAddress?: string;
}

/** Step 3 — Legal & Documents */
export interface DocumentsFormData {
  offeringMemorandum?: File | null;
  subscriptionAgreement?: File | null;
  legalOpinion?: File | null;
  auditReport?: File | null;
  additionalDocs?: File[];
  spvEntityName?: string;
  spvJurisdiction?: string;
  regulatoryExemption?: string;
  documentHashes?: Record<string, string>; // IPFS / arweave CIDs
}

/** Step 4 — Compliance Rules */
export interface ComplianceFormData {
  kycTier: KycTier;
  transferMode: TransferMode;
  holdPeriodDays?: number;
  maxInvestors?: number;
  minInvestmentAmount?: string;
  maxInvestmentAmount?: string;
  allowedJurisdictions: JurisdictionCode[];
  blockedJurisdictions: JurisdictionCode[];
  enableProofOfBacking: boolean;
  requireAccreditedStatus: boolean;
  complianceCheckerAddress?: string;
}

/** Aggregated wizard state */
export interface AssetWizardState {
  step: 1 | 2 | 3 | 4 | 5;
  assetDetails: Partial<AssetDetailsFormData>;
  tokenConfig: Partial<TokenConfigFormData>;
  documents: Partial<DocumentsFormData>;
  compliance: Partial<ComplianceFormData>;
}

/** Fully assembled asset before submission */
export type AssetSubmissionPayload = {
  assetDetails: AssetDetailsFormData;
  tokenConfig: TokenConfigFormData;
  documents: DocumentsFormData;
  compliance: ComplianceFormData;
};
