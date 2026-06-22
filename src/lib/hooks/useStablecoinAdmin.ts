"use client";

// ============================================================
// lib/hooks/useStablecoinAdmin.ts
//
// Address-parametrized write runner for stablecoin admin actions. The
// generated stablecoin-token / reserve-oracle write hooks resolve their
// target from the registry (singleton fallback) — but a stablecoin token
// is PER-INSTANCE, so the detail page must target the specific token /
// oracle address being viewed. This thin hook runs any (address, abi,
// fn, args) through the same transactionService path the generated hooks
// use, so reverts still decode against the generated ABIs.
// ============================================================

import { useCallback, useState } from "react";
import { useChainId } from "wagmi";
import { transactionService } from "@/lib/container";
import type { Address, Hex } from "@/lib/core/types";

export interface AdminActionParams {
  address: Address;
  abi: readonly unknown[];
  functionName: string;
  args: readonly unknown[];
  description?: string;
}

export function useStablecoinAdminAction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<Hex | null>(null);
  const chainId = useChainId();

  const run = useCallback(
    async (params: AdminActionParams) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await transactionService.execute({
          contractCall: {
            address: params.address,
            abi: params.abi,
            functionName: params.functionName,
            args: params.args,
            chainId,
          },
          description: params.description,
        });
        if (result.status === "failed" && result.error) {
          setError(result.error);
          throw result.error;
        }
        setHash(result.hash);
        return result.hash;
      } finally {
        setIsLoading(false);
      }
    },
    [chainId],
  );

  const reset = useCallback(() => {
    setError(null);
    setHash(null);
  }, []);

  return { run, isLoading, error, hash, reset };
}
