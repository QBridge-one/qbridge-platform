// ============================================================
// lib/core/types.ts
// Domain model types — the heart of the hexagonal architecture.
// Zero dependencies on any framework, library, or adapter.
// Everything else depends on these. These depend on nothing.
// ============================================================

// ─── Chain ───────────────────────────────────────────────────
export type ChainId = number;

export interface Chain {
  id: ChainId;
  name: string;
  rpcUrl: string;
  blockExplorerUrl?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// ─── Address ─────────────────────────────────────────────────
export type Address = `0x${string}`;
export type Bytes32 = `0x${string}`;
export type Hex = `0x${string}`;

// ─── Wallet ───────────────────────────────────────────────────
export type WalletType =
  | "embedded"       // Web3Auth social login — current
  | "smart_account"  // ERC-4337 — Alchemy future
  | "safe"           // Safe multisig — optional future
  | "injected";      // MetaMask / browser extension

export interface WalletState {
  isConnected: boolean;
  address: Address | null;
  chainId: ChainId | null;
  walletType: WalletType | null;
  isSmartAccount: boolean;
  isSafe: boolean;
}

// ─── Transaction ─────────────────────────────────────────────
export interface TransactionRequest {
  to: Address;
  data?: Hex;
  value?: bigint;
  chainId?: ChainId;
  // ERC-4337 / smart account fields (ignored by EOA adapters)
  paymasterData?: Hex;
  callGasLimit?: bigint;
  verificationGasLimit?: bigint;
  preVerificationGas?: bigint;
  // Optional human-facing confirmation for the wallet's pre-sign prompt.
  // Set by the transaction service for on-chain writes; the wallet adapter
  // maps it to a provider confirmation UI (e.g. Privy uiOptions).
  confirmation?: { description?: string };
}

export type TransactionStatus =
  | "idle"
  | "preparing"      // building tx / pre-flight checks
  | "signing"        // waiting for user wallet signature
  | "pending"        // submitted, waiting for inclusion
  | "confirming"     // included, waiting for confirmations
  | "confirmed"      // finalized
  | "failed"         // reverted or error
  | "cancelled";     // user rejected

export interface TransactionResult {
  hash: Hex;
  status: TransactionStatus;
  blockNumber?: bigint;
  blockHash?: Hex;
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
}

export interface TransactionCallbacks {
  onSign?: (hash: Hex) => void;
  onSubmit?: (hash: Hex) => void;
  onConfirm?: (result: TransactionResult) => void;
  onError?: (error: DomainError) => void;
}

// ─── Gas Policy ──────────────────────────────────────────────
export type GasSponsorshipStatus =
  | "not_applicable"   // user pays — Web3Auth current state
  | "sponsored"        // platform sponsors
  | "partial"          // platform sponsors up to a limit
  | "exhausted"        // tier limit reached
  | "ineligible";      // this function not covered by policy

export interface GasPolicy {
  sponsorshipStatus: GasSponsorshipStatus;
  policyId?: string;         // Alchemy Gas Manager policy ID
  sponsoredFunctions?: Hex[]; // function selectors covered
  monthlyLimitWei?: bigint;
  usedThisMonthWei?: bigint;
}

// ─── Multisig ─────────────────────────────────────────────────
export type MultisigStatus =
  | "not_required"
  | "collecting_signatures"
  | "threshold_reached"
  | "executed"
  | "rejected";

export interface MultisigApproval {
  safeAddress: Address;
  threshold: number;
  currentSignatures: number;
  status: MultisigStatus;
  safeTxHash?: Bytes32;
  signers: Address[];
}

// ─── Compliance ───────────────────────────────────────────────
export type ComplianceCheckStatus =
  | "passed"
  | "failed"
  | "pending"
  | "skipped";   // read-only functions skip compliance

export interface ComplianceCheckResult {
  status: ComplianceCheckStatus;
  reason?: string;
  // Which check failed (KYC, jurisdiction, freeze, hold period, etc.)
  failedRule?: string;
}

// ─── Smart Account ───────────────────────────────────────────
export interface SmartAccountConfig {
  enabled: boolean;
  accountAddress?: Address;   // the smart account contract address
  factoryAddress?: Address;
  entryPointAddress?: Address;
  safeConfig?: {
    enabled: boolean;
    threshold: number;
    owners: Address[];
      safeAddress?: Address;
  };
}

// ─── Tier / SaaS ─────────────────────────────────────────────
export type PlatformTier =
  | "trial"
  | "growth"
  | "pro"
  | "enterprise";

export interface TierPolicy {
  tier: PlatformTier;
  gasSponsorship: GasSponsorshipStatus;
  safeMultisigEnabled: boolean;
  smartAccountEnabled: boolean;
  monthlyGasLimitWei: bigint | null; // null = unlimited
}

// ─── Contract Call ───────────────────────────────────────────
export interface ContractCallParams {
  address: Address;
  abi: readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
  chainId?: ChainId;
}

export interface ContractReadResult<T = unknown> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: DomainError | null;
  refetch: () => void;
}

export interface ContractWriteResult {
  hash: Hex | null;
  status: TransactionStatus;
  isLoading: boolean;
  isError: boolean;
  error: DomainError | null;
  write: (params: ContractCallParams) => Promise<Hex>;
  reset: () => void;
}

// ─── Domain Errors ───────────────────────────────────────────
export type DomainErrorCode =
  | "WALLET_NOT_CONNECTED"
  | "WALLET_WRONG_CHAIN"
  | "TRANSACTION_REJECTED"
  | "TRANSACTION_REVERTED"
  | "TRANSACTION_FAILED"
  | "COMPLIANCE_CHECK_FAILED"
  | "INSUFFICIENT_ROLE"
  | "GAS_POLICY_EXHAUSTED"
  | "MULTISIG_REJECTED"
  | "CONTRACT_CALL_FAILED"
  | "PROVIDER_NOT_INITIALIZED"
  | "ADAPTER_NOT_IMPLEMENTED"
  // Identity / org / invites
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "ORG_NOT_FOUND"
  | "MEMBERSHIP_NOT_FOUND"
  | "INVITE_NOT_FOUND"
  | "INVITE_ALREADY_EXISTS"
  | "ISSUER_KYB_CONFLICT"
  | "WALLET_LINK_INVALID"
  | "WEBHOOK_SIGNATURE_INVALID"
  | "UNKNOWN";

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

// ─── Event bus (lightweight) ─────────────────────────────────
// Used by services to emit domain events without coupling adapters
export type DomainEventType =
  | "transaction.submitted"
  | "transaction.confirmed"
  | "transaction.failed"
  | "wallet.connected"
  | "wallet.disconnected"
  | "wallet.chain_changed"
  | "compliance.check_failed"
  | "role.granted"
  | "role.revoked"
  | "operation.scheduled";

export interface DomainEvent<T = unknown> {
  type: DomainEventType;
  payload: T;
  timestamp: number;
}
