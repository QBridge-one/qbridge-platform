// ============================================================
// types/stablecoin.ts
//
// Typed StablecoinConfig tuple for StablecoinFactory.createStablecoin
// (the codegen maps the nested tuple to `unknown`, so we type it here —
// mirrors types/deal.ts DealConfig). Object keys match the ABI tuple
// component names so viem encodes it directly.
// ============================================================

import type { Address, Hex } from "@/lib/core/types";

/** Stablecoin product category label — stored on TokenRegistry as keccak256(label). */
export const STABLECOIN_CATEGORY = "STABLECOIN" as const;

/** Sub-classifications for a payment stablecoin. */
export const STABLECOIN_ASSET_TYPES = [
  { value: "USD_FIAT", label: "USD (fiat-backed)" },
  { value: "EUR_FIAT", label: "EUR (fiat-backed)" },
  { value: "GBP_FIAT", label: "GBP (fiat-backed)" },
] as const;

/**
 * On-chain TransferPolicy enum (StablecoinComplianceChecker). Governs P2P
 * transfers only — issuance and redemption are KYC-gated regardless.
 *   0 Allowlist — both parties must be KYC-verified + jurisdiction-approved.
 *   1 Blocklist — open circulation; only blocked/sanctioned addresses rejected.
 */
export const TRANSFER_POLICY = { Allowlist: 0, Blocklist: 1 } as const;

export const TRANSFER_POLICY_OPTIONS = [
  { value: "1", label: "Blocklist (open — USDC/USDT model)", hint: "Anyone can hold/transfer except blocked/sanctioned addresses." },
  { value: "0", label: "Allowlist (permissioned)", hint: "Every holder must be KYC-verified + jurisdiction-approved to transfer." },
] as const;

export interface StablecoinTokenParams {
  name: string;
  symbol: string;
  decimals: number;
  description: string;
  treasury: Address;
  globalMintCap: bigint;
  maxReserveAttestationAge: bigint;
}

export interface StablecoinReserveOracleParams {
  maxReserveChangeBps: bigint;
  stalenessWarningSeconds: bigint;
}

export interface StablecoinComplianceParams {
  /** TransferPolicy enum: 0 Allowlist | 1 Blocklist. */
  transferPolicy: number;
}

export interface StablecoinConfig {
  stablecoinId: Hex;
  salt: Hex;
  category: Hex;
  assetType: Hex;
  dealAdmin: Address;
  platformProposer: Address;
  issuerExecutor: Address;
  timelockMinDelay: bigint;
  tokenParams: StablecoinTokenParams;
  reserveOracleParams: StablecoinReserveOracleParams;
  complianceParams: StablecoinComplianceParams;
}

/** Field keys on getDeployedStablecoin's record → human labels (for the deploy summary). */
export const STABLECOIN_CLUSTER_LABELS: Record<string, string> = {
  token: "Token",
  complianceChecker: "Compliance checker",
  identityRegistry: "Identity registry",
  reserveOracle: "Reserve oracle",
  tokenAccessManager: "Token access manager",
  timelock: "Timelock",
};
