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
