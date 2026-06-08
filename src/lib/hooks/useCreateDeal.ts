"use client";

// ============================================================
// lib/hooks/useCreateDeal.ts
//
// Hand-written (not codegen) typed write hook for
// SingleSpvRealEstateFactory.createDeal. The codegen maps the nested
// DealConfig tuple to `unknown`, so this wraps transactionService with
// a fully-typed DealConfig instead. Same execution path as the
// generated write hooks (transactionService → WalletPort → Privy).
// ============================================================

import { useCallback, useState } from "react";
import { useChainId } from "wagmi";
import { transactionService } from "@/lib/container";
import { useContractAddress } from "@/lib/hooks/useContracts";
import type { Address, Hex } from "@/lib/core/types";
import { CREATE_DEAL_ABI } from "@/lib/contracts/create-deal-abi";
import type { DealConfig } from "@/types/deal";

export function useCreateDeal() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<Hex | null>(null);
  const contractAddress = useContractAddress("factory") as Address | null;
  const chainId = useChainId();

  const createDeal = useCallback(
    async (config: DealConfig) => {
      if (!contractAddress) {
        const err = new Error("Factory address is not configured for this chain.");
        setError(err);
        throw err;
      }
      setIsLoading(true);
      setError(null);
      try {
        const result = await transactionService.execute({
          contractCall: {
            address: contractAddress,
            abi: CREATE_DEAL_ABI,
            functionName: "createDeal",
            args: [config],
            chainId,
          },
          description: `Deploy deal ${config.tokenParams.name}`,
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
    [contractAddress, chainId],
  );

  const reset = useCallback(() => {
    setError(null);
    setHash(null);
  }, []);

  return { createDeal, isLoading, error, hash, reset };
}
