// ============================================================
// lib/adapters/blockchain/viem.adapter.ts
//
// BlockchainPort implementation using viem public client.
// Uses wagmi core's getPublicClient — no React hooks needed.
// ============================================================

import { getPublicClient, waitForTransactionReceipt } from "@wagmi/core";
import { wagmiConfig } from "@/lib/wagmi-config";

import type { BlockchainPort } from "../../ports/blockchain.port";
import type {
  Address, ChainId, Hex, TransactionResult, ContractCallParams,
} from "../../core/types";
import { normalizeToDomainError } from "../../core/errors";

export class ViemAdapter implements BlockchainPort {
  private client(chainId?: ChainId) {
    const client = getPublicClient(wagmiConfig, chainId ? { chainId: chainId as 1 | 11155111 | 137 } : undefined);
    if (!client) throw new Error("ViemAdapter: no public client for chain");
    return client;
  }

  async readContract<T = unknown>(params: ContractCallParams): Promise<T> {
    try {
      const result = await this.client(params.chainId).readContract({
        address: params.address,
        abi: params.abi as any,
        functionName: params.functionName,
        args: params.args as any,
      });
      return result as T;
    } catch (err) {
      throw normalizeToDomainError(err);
    }
  }

  async readContractMulticall(calls: ContractCallParams[]): Promise<unknown[]> {
    try {
      const chainId = calls[0]?.chainId;
      const results = await this.client(chainId).multicall({
        contracts: calls.map((c) => ({
          address: c.address,
          abi: c.abi as any,
          functionName: c.functionName,
          args: c.args as any,
        })),
      });
      return results.map((r) => (r.status === "success" ? r.result : null));
    } catch (err) {
      throw normalizeToDomainError(err);
    }
  }

  async getBlockNumber(): Promise<bigint> {
    try {
      return await this.client().getBlockNumber();
    } catch (err) {
      throw normalizeToDomainError(err);
    }
  }

  async getBalance(address: Address): Promise<bigint> {
    try {
      return await this.client().getBalance({ address });
    } catch (err) {
      throw normalizeToDomainError(err);
    }
  }

  async getChainId(): Promise<ChainId> {
    return this.client().chain?.id ?? 1;
  }

  async getTransaction(hash: Hex): Promise<TransactionResult | null> {
    try {
      const tx = await this.client().getTransactionReceipt({ hash });
      if (!tx) return null;
      return {
        hash,
        status: tx.status === "success" ? "confirmed" : "failed",
        blockNumber: tx.blockNumber,
        blockHash: tx.blockHash as Hex,
        gasUsed: tx.gasUsed,
        effectiveGasPrice: tx.effectiveGasPrice,
      };
    } catch {
      return null;
    }
  }

  async waitForTransaction(hash: Hex, confirmations = 1): Promise<TransactionResult> {
    try {
      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash,
        confirmations,
      });
      return {
        hash,
        status: receipt.status === "success" ? "confirmed" : "failed",
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash as Hex,
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
      };
    } catch (err) {
      throw normalizeToDomainError(err);
    }
  }

  async getLogs(params: {
    address: Address;
    abi: readonly unknown[];
    eventName: string;
    fromBlock?: bigint;
    toBlock?: bigint;
    args?: Record<string, unknown>;
  }): Promise<unknown[]> {
    try {
      return await this.client().getContractEvents({
        address: params.address,
        abi: params.abi as any,
        eventName: params.eventName as any,
        fromBlock: params.fromBlock ?? "earliest",
        toBlock: params.toBlock ?? "latest",
        args: params.args as any,
      });
    } catch (err) {
      throw normalizeToDomainError(err);
    }
  }
}

export const viemAdapter = new ViemAdapter();
