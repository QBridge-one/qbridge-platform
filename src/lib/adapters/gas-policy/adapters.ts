// ============================================================
// lib/adapters/gas-policy/no-sponsorship.adapter.ts
// Default gas policy adapter — user/wallet always pays gas (this port).
// Privy native sponsorship is applied in the wallet adapter via the
// `sponsor` flag (see config/privy.ts), independent of this adapter.
// Swap for AlchemyGasManagerAdapter if/when Alchemy paymaster is integrated.
// ============================================================

import type { GasPolicyPort } from "../../ports/index";
import type { Address, Hex, GasPolicy, TransactionRequest } from "../../core/types";

export class NoSponsorshipAdapter implements GasPolicyPort {
  async checkEligibility(_params: {
    callerAddress: Address;
    targetAddress: Address;
    selector: Hex;
    issuerId?: string;
    tier?: string;
  }): Promise<GasPolicy> {
    // No sponsorship — user always pays
    return { sponsorshipStatus: "not_applicable" };
  }

  async buildPaymasterData(
    _request: TransactionRequest,
    _policy: GasPolicy,
  ): Promise<Hex | null> {
    return null; // No paymaster
  }

  async recordUsage(_params: {
    issuerId: string;
    gasUsedWei: bigint;
    txHash: Hex;
  }): Promise<void> {
    // Nothing to record
  }
}

export const noSponsorshipAdapter = new NoSponsorshipAdapter();

// ============================================================
// lib/adapters/gas-policy/alchemy-gas-manager.adapter.ts
// STUB — Alchemy Gas Manager adapter.
// Implements tier-based gas sponsorship policies.
// ============================================================

export class AlchemyGasManagerAdapter implements GasPolicyPort {
  constructor(
    private readonly config: {
      apiKey: string;
      policyId: string;
    }
  ) {}

  async checkEligibility(_params: {
    callerAddress: Address;
    targetAddress: Address;
    selector: Hex;
    issuerId?: string;
    tier?: string;
  }): Promise<GasPolicy> {
    // TODO: query Alchemy Gas Manager API for policy eligibility
    // Check tier limits, function selector whitelist, monthly caps
    throw new Error("AlchemyGasManagerAdapter: not yet implemented");
  }

  async buildPaymasterData(
    _request: TransactionRequest,
    _policy: GasPolicy,
  ): Promise<Hex | null> {
    // TODO: call Alchemy paymaster_sponsorUserOperation
    throw new Error("AlchemyGasManagerAdapter: not yet implemented");
  }

  async recordUsage(_params: {
    issuerId: string;
    gasUsedWei: bigint;
    txHash: Hex;
  }): Promise<void> {
    // TODO: update tier usage in your backend
    throw new Error("AlchemyGasManagerAdapter: not yet implemented");
  }
}
