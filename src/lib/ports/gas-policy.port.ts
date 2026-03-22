// ============================================================
// lib/ports/gas-policy.port.ts
// GasPolicy port — sponsorship rules per function/tier.
// Web3Auth adapter: always returns "not_applicable".
// Alchemy Gas Manager adapter: checks policy and builds paymaster data.
// ============================================================

import type { Address, Hex, GasPolicy, TransactionRequest } from "../core/types";

export interface GasPolicyPort {
  // Check if a transaction is eligible for sponsorship
  checkEligibility(params: {
    callerAddress: Address;
    targetAddress: Address;
    selector: Hex;
    issuerId?: string;
    tier?: string;
  }): Promise<GasPolicy>;

  // Build paymaster data to attach to the UserOperation
  // Returns null if not sponsored (caller pays gas)
  buildPaymasterData(
    request: TransactionRequest,
    policy: GasPolicy,
  ): Promise<Hex | null>;

  // Record usage after a transaction confirms (for tier limits)
  recordUsage(params: {
    issuerId: string;
    gasUsedWei: bigint;
    txHash: Hex;
  }): Promise<void>;
}
