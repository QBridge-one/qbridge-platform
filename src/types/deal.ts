// ============================================================
// types/deal.ts
//
// Typed model for SingleSpvRealEstateFactory.createDeal(DealConfig).
// Mirrors the on-chain tuple component names EXACTLY — viem encodes a
// named tuple from an object keyed by those component names.
//
// Vertical note: this models the REAL-ESTATE deal cluster
// (SingleSpvRealEstateFactory / SingleSpvRealEstateToken). A future
// stablecoin vertical will be a separate factory + config; the wizard
// shell, address/bytes32 primitives, and submit/receipt flow are
// vertical-agnostic and meant to be reused.
// ============================================================

import type { Address, Hex } from "@/lib/core/types";

// ─── ShareClass enum ──────────────────────────────────────────
// Solidity `enum SingleSpvRealEstateToken.ShareClass` (uint8):
//   0 = None (INVALID sentinel — rejected by ClassConfigNoneShareClass())
//   1 = Class A · 2 = Class AA · 3 = Class B
// Confirmed against SingleSpvRealEstateTokenLib. Never emit 0.
export const SHARE_CLASS_NONE = 0 as const;
export const SHARE_CLASS_B = 3 as const; // manager carry/promote class

export const SHARE_CLASSES = [
  { value: 1, key: "A", label: "Class A" },
  { value: 2, key: "AA", label: "Class AA" },
  { value: 3, key: "B", label: "Class B" },
] as const;

export type ShareClassValue = (typeof SHARE_CLASSES)[number]["value"];

export function shareClassLabel(value: number): string {
  return SHARE_CLASSES.find((c) => c.value === value)?.label ?? `Class #${value}`;
}

// ─── Category / asset-type presets (real estate) ──────────────
// Stored on-chain as bytes32 (keccak256 of the label — same convention
// as entityIdFromOrgId). Issuers pick a preset or enter a custom label;
// an advanced raw-bytes32 override is also accepted (see factory-payload).
export const DEAL_CATEGORY = "REAL_ESTATE" as const;

export const REAL_ESTATE_ASSET_TYPES = [
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "MIXED_USE", label: "Mixed Use" },
  { value: "LAND", label: "Land / Development" },
] as const;

// ─── On-chain DealConfig tuple (what createDeal receives) ──────

export interface SubTierConfig {
  tierId: number; // uint8
  label: string;
  minimumCommitment: bigint; // uint256
  classSplitBps: number; // uint16
  classBSplitBps: number; // uint16
}

export interface ClassInitConfig {
  shareClass: number; // uint8 (ShareClass enum)
  classMintCap: bigint; // uint256
  subscribable: boolean;
  managerMintOnly: boolean;
  holdPeriodDays: number; // uint16
  subTiers: SubTierConfig[];
}

export interface CombinedCapInit {
  cap: bigint; // uint256
  applicableClasses: number[]; // uint8[] (ShareClass enum)
}

export interface TokenInitParams {
  name: string;
  symbol: string;
  decimals: number; // uint8
  description: string;
  treasury: Address;
  globalMintCap: bigint; // uint256
  spvLegalEntity: Address;
  dealMetadataURI: string;
  unitPriceAtIssuance: bigint; // uint256
  classes: ClassInitConfig[];
  combinedCap: CombinedCapInit;
}

export interface InitialAttestation {
  navPerUnitCents: bigint; // uint256
  asOfTimestamp: bigint; // uint64 (unix seconds)
  reportURIHash: Hex; // bytes32
  reportURI: string;
  methodologyNote: string;
}

export interface OracleInitParams {
  maxNavChangeBps: bigint; // uint256
  stalenessWarningSeconds: bigint; // uint64
  initialAttestation: InitialAttestation;
}

export interface ComplianceInitParams {
  accreditationValidity: bigint; // uint64 (seconds)
  holdPeriodClassA: bigint; // uint64 (seconds)
  holdPeriodClassAA: bigint; // uint64 (seconds)
}

export interface DistributionInitParams {
  calculator: Address;
}

export interface CapitalCallInitParams {
  executionGracePeriod: bigint; // uint64 (seconds)
}

/** The full tuple passed to factory.createDeal(config). */
export interface DealConfig {
  dealId: Hex; // bytes32
  salt: Hex; // bytes32
  category: Hex; // bytes32
  assetType: Hex; // bytes32
  dealAdmin: Address;
  platformProposer: Address;
  issuerExecutor: Address;
  timelockMinDelay: bigint; // uint256 (seconds)
  tokenParams: TokenInitParams;
  oracleParams: OracleInitParams;
  complianceParams: ComplianceInitParams;
  distributionParams: DistributionInitParams;
  capitalCallParams: CapitalCallInitParams;
}

/** DealRecord returned by createDeal / getDeployedDeal — the deployed cluster. */
export interface DealRecord {
  dealId: Hex;
  issuer: Address;
  token: Address;
  complianceChecker: Address;
  identityRegistry: Address;
  navOracle: Address;
  distributionSettlement: Address;
  capitalCallManager: Address;
  tokenAccessManager: Address;
  timelock: Address;
  deployedAt: bigint; // uint64
  deployedBy: Address;
}

/** Human labels for the cluster addresses in a DealRecord (review/result UI). */
export const DEAL_CLUSTER_LABELS: Record<string, string> = {
  token: "Security Token",
  complianceChecker: "Compliance Checker",
  identityRegistry: "Identity Registry",
  navOracle: "NAV Oracle",
  distributionSettlement: "Distribution Settlement",
  capitalCallManager: "Capital Call Manager",
  tokenAccessManager: "Token Access Manager",
  timelock: "Timelock",
};
