// ============================================================
// types/db.ts
// Runtime data shapes — what comes from your DB / API / contract
// These are NOT form types (see assets.ts for those)
// ============================================================

import type { AssetType, AssetStatus, KycTier, TransferMode, JurisdictionCode } from "./assets";
import type { TokenRole } from "./roles";

// ─── Stored asset (DB record) ─────────────────────────────────
export interface Asset {
  id: string;
  // On-chain
  contractAddress?: string;         // null until deployed
  tokenAccessManagerAddress?: string;
  chainId: number;
  // Details
  name: string;
  symbol: string;
  assetType: AssetType;
  description: string;
  jurisdiction: JurisdictionCode;
  // Issuer
  issuerId: string;
  issuerLegalName: string;
  issuerWallet: string;             // holds ADMIN_ROLE on token AM
  // Token config
  totalSupply: string;              // bigint as string
  pricePerToken: string;
  currency: "USD" | "CAD" | "EUR" | "USDC";
  decimals: number;
  softCap?: string;
  hardCap?: string;
  treasuryAddress: string;
  enableBacking: boolean;
  backingVerifierAddress?: string;
  complianceCheckerAddress?: string;
  // Compliance
  kycTier: KycTier;
  transferMode: TransferMode;
  holdPeriodDays?: number;
  maxInvestors?: number;
  minInvestmentAmount?: string;
  maxInvestmentAmount?: string;
  allowedJurisdictions: JurisdictionCode[];
  blockedJurisdictions: JurisdictionCode[];
  requireAccreditedStatus: boolean;
  // Platform lifecycle
  status: AssetStatus;
  rejectionReason?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  // Aggregates (from contract or indexed events)
  circulatingSupply?: string;
  investorCount?: number;
  frozenAccountCount?: number;
  isPaused?: boolean;
  isEmergencyPaused?: boolean;
}

// ─── Investor / cap table entry ───────────────────────────────
export interface Investor {
  id: string;
  walletAddress: string;
  email?: string;
  name?: string;
  legalName?: string;
  kycTier: KycTier;
  kycStatus: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  kycExpiresAt?: string;
  isAccredited: boolean;
  jurisdiction: JurisdictionCode;
  // Per-asset allocation
  balance: string;                  // token balance (bigint as string)
  frozenBalance: string;            // frozen portion
  isFullyFrozen: boolean;
  investedAmount: string;           // in currency
  firstInvestmentAt: string;
  lastTransactionAt?: string;
  // Platform
  isBlacklisted: boolean;
  notes?: string;
}

// ─── Token operation (on-chain event) ────────────────────────
export type TokenOpType =
  | "MINT"
  | "BURN"
  | "FORCE_TRANSFER"
  | "FORCE_BURN"
  | "FREEZE"
  | "UNFREEZE"
  | "PARTIAL_FREEZE"
  | "PAUSE"
  | "UNPAUSE"
  | "EMERGENCY_PAUSE"
  | "EMERGENCY_UNPAUSE"
  | "TRANSFER";

export interface TokenOperation {
  id: string;
  assetId: string;
  type: TokenOpType;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  // Addresses
  from?: string;
  to?: string;
  operator: string;               // who triggered it
  // Amounts
  amount?: string;
  // Extra
  reason?: string;
  roleUsed?: TokenRole;
}

// ─── Compliance flag ──────────────────────────────────────────
export type FlagSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type FlagStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";

export interface ComplianceFlag {
  id: string;
  assetId: string;
  assetName: string;
  investorId?: string;
  investorWallet?: string;
  severity: FlagSeverity;
  status: FlagStatus;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

// ─── Team member ──────────────────────────────────────────────
export interface TeamMember {
  id: string;
  walletAddress: string;
  email?: string;
  name?: string;
  // Platform-level role (PlatformAccessManager)
  platformRole?: string;           // ADMIN | COMPLIANCE | OPERATOR | AUDITOR | null
  // Token-level roles per asset
  tokenRoles: {
    assetId: string;
    assetName: string;
    assetSymbol: string;
    role: TokenRole;
    grantedAt: string;
    grantedBy: string;
  }[];
  addedAt: string;
  lastActiveAt?: string;
  isActive: boolean;
}

// ─── Pagination helper ────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
