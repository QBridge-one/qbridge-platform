"use client";

// ============================================================
// lib/hooks/useCreateStablecoin.ts
//
// Hand-written typed write hook for StablecoinFactory.createStablecoin.
// The codegen maps the nested tuple to `unknown`, so this wraps
// transactionService with a fully-typed StablecoinConfig. Same execution
// path as the generated write hooks (transactionService → WalletPort → Privy).
// ============================================================

import { useCallback, useState } from "react";
import { useChainId } from "wagmi";
import { transactionService } from "@/lib/container";
import { useContractAddress } from "@/lib/hooks/useContracts";
import type { Address, Hex } from "@/lib/core/types";
import { CREATE_STABLECOIN_ABI } from "@/lib/contracts/create-stablecoin-abi";
import type { StablecoinConfig } from "@/types/stablecoin";

export function useCreateStablecoin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<Hex | null>(null);
  const contractAddress = useContractAddress("stablecoinFactory") as Address | null;
  const chainId = useChainId();

  const createStablecoin = useCallback(
    async (config: StablecoinConfig) => {
      if (!contractAddress) {
        const err = new Error("Stablecoin factory address is not configured for this chain.");
        setError(err);
        throw err;
      }
      setIsLoading(true);
      setError(null);
      try {
        const result = await transactionService.execute({
          contractCall: {
            address: contractAddress,
            abi: CREATE_STABLECOIN_ABI,
            functionName: "createStablecoin",
            args: [config],
            chainId,
          },
          description: `Deploy stablecoin ${config.tokenParams.name}`,
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

  return { createStablecoin, isLoading, error, hash, reset };
}
