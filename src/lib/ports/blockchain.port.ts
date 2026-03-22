// ============================================================
// lib/ports/blockchain.port.ts
// BlockchainReader port — read-only chain access.
// Abstracts viem public client, Alchemy RPC, etc.
// ============================================================

import type {
  Address, ChainId, Hex, Bytes32,
  TransactionResult, ContractCallParams,
} from "../core/types";

export interface BlockchainPort {
  // ── Contract reads ───────────────────────────────────────
  readContract<T = unknown>(params: ContractCallParams): Promise<T>;
  readContractMulticall(calls: ContractCallParams[]): Promise<unknown[]>;

  // ── Chain state ──────────────────────────────────────────
  getBlockNumber(): Promise<bigint>;
  getBalance(address: Address): Promise<bigint>;
  getChainId(): Promise<ChainId>;

  // ── Transaction ──────────────────────────────────────────
  getTransaction(hash: Hex): Promise<TransactionResult | null>;
  waitForTransaction(hash: Hex, confirmations?: number): Promise<TransactionResult>;

  // ── Events ───────────────────────────────────────────────
  getLogs(params: {
    address: Address;
    abi: readonly unknown[];
    eventName: string;
    fromBlock?: bigint;
    toBlock?: bigint;
    args?: Record<string, unknown>;
  }): Promise<unknown[]>;
}
