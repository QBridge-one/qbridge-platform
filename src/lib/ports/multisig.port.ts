// ============================================================
// lib/ports/multisig.port.ts
// MultisigApproval port — Safe signature collection.
// Not required for all roles — policy-driven.
// Web3Auth / Alchemy adapters: return "not_required" by default.
// Safe adapter: full implementation.
// ============================================================

import type { Address, Bytes32, Hex, MultisigApproval, TransactionRequest } from "../core/types";

export interface MultisigPort {
  // Is multisig required for this caller + function?
  isRequired(params: {
    callerAddress: Address;
    targetAddress: Address;
    selector: Hex;
  }): Promise<boolean>;

  // Propose a transaction to the Safe — returns safeTxHash
  propose(params: {
    safeAddress: Address;
    request: TransactionRequest;
  }): Promise<Bytes32>;

  // Get current approval status
  getApprovalStatus(safeTxHash: Bytes32): Promise<MultisigApproval>;

  // Sign an existing proposal (called by each co-signer)
  sign(safeTxHash: Bytes32): Promise<void>;

  // Execute once threshold is reached
  execute(safeTxHash: Bytes32): Promise<Hex>; // returns tx hash
}
