"use client";

// ============================================================
// lib/hooks/useContractRead.ts
//
// Typed hook for all contract reads.
// Wraps wagmi's useReadContract but normalizes errors
// and exposes domain types — no viem/wagmi types leak to UI.
// ============================================================

import { useReadContract } from "wagmi";
import type {
  ContractCallParams, ContractReadResult, ContractWriteResult,
  TransactionStatus, Hex, DomainError,
} from "../core/types";
import { normalizeToDomainError } from "../core/errors";

export function useContractRead<T = unknown>(
  params: ContractCallParams | null,
): ContractReadResult<T> {
  const result = useReadContract(
    params
      ? {
          address: params.address,
          abi: params.abi as any,
          functionName: params.functionName,
          args: params.args as any,
          chainId: params.chainId,
        }
      : undefined,
  );

  return {
    data: (result.data as T) ?? null,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error ? normalizeToDomainError(result.error) : null,
    refetch: result.refetch,
  };
}

// ============================================================
// lib/hooks/useContractWrite.ts
//
// Typed hook for all contract writes.
// Full flow: compliance pre-flight → gas policy → sign → submit → confirm.
// Uses TransactionService from the container.
// ============================================================

import { useState, useCallback } from "react";
import { transactionService } from "../container";

export function useContractWrite(): ContractWriteResult {
  const [hash, setHash] = useState<Hex | null>(null);
  const [status, setStatus] = useState<TransactionStatus>("idle");
  const [error, setError] = useState<DomainError | null>(null);

  const write = useCallback(
    async (params: ContractCallParams): Promise<Hex> => {
      setStatus("preparing");
      setError(null);
      setHash(null);

      const result = await transactionService.execute({
        contractCall: params,
        callbacks: {
          onSubmit: (h) => {
            setHash(h);
            setStatus("pending");
          },
          onConfirm: () => {
            setStatus("confirmed");
          },
          onError: (err) => {
            setError(normalizeToDomainError(err));
            setStatus("failed");
          },
        },
      });

      if (result.status === "failed" || !result.hash) {
        setStatus("failed");
        throw result.error ?? new Error("Transaction failed");
      }

      return result.hash;
    },
    [],
  );

  const reset = useCallback(() => {
    setHash(null);
    setStatus("idle");
    setError(null);
  }, []);

  return {
    hash,
    status,
    isLoading: status === "preparing" || status === "pending" || status === "signing",
    isError: status === "failed",
    error,
    write,
    reset,
  };
}
