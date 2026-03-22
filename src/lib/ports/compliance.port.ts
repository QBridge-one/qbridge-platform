// ============================================================
// lib/ports/compliance.port.ts
// Compliance pre-flight check port.
// Runs BEFORE submitting a transaction to avoid wasting gas on known failures.
// On-chain adapter: simulates the tx and checks IComplianceChecker.
// KYC provider adapter: checks off-chain KYC/AML status.
// ============================================================

import type { Address, ComplianceCheckResult, ContractCallParams } from "../core/types";

export interface CompliancePort {
  // Simulate a contract call and check if it would pass compliance
  preflightCheck(params: {
    callerAddress: Address;
    contractCall: ContractCallParams;
  }): Promise<ComplianceCheckResult>;

  // Check if an account is KYC-verified for a given jurisdiction
  checkKYC(params: {
    address: Address;
    jurisdiction: string;
    requiredTier: string;
  }): Promise<ComplianceCheckResult>;

  // Check if an account is frozen on a specific token
  checkFrozen(params: {
    tokenAddress: Address;
    accountAddress: Address;
  }): Promise<boolean>;
}
