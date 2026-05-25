"use client";

// ============================================================
// lib/hooks/useContracts.ts
//
// Resolves contract addresses for the wallet's current chain.
// Returns `null` when the chain is unsupported or env vars are missing
// so consumers (toggles, write hooks) stay disabled.
//
// Usage:
//   const { platformAccessManager, tokenAccessManager } = useContracts()
// ============================================================

import { useChainId } from "wagmi";
import { getContractAddress, getContracts, isChainSupported } from "@/lib/contracts/registry";

type Address = `0x${string}`;

export interface ContractAddresses {
  platformAccessManager: Address | null;
  tokenAccessManager: Address | null;
  issuerRegistry: Address | null;
  isSupported: boolean;
  chainId: number;
}

export function useContracts(): ContractAddresses {
  const chainId = useChainId();

  if (!isChainSupported(chainId)) {
    return {
      platformAccessManager: null,
      tokenAccessManager: null,
      issuerRegistry: null,
      isSupported: false,
      chainId,
    };
  }

  try {
    const contracts = getContracts(chainId);
    return {
      platformAccessManager: contracts.platformAccessManager || null,
      tokenAccessManager: contracts.tokenAccessManager || null,
      issuerRegistry: contracts.issuerRegistry || null,
      isSupported: true,
      chainId,
    };
  } catch {
    return {
      platformAccessManager: null,
      tokenAccessManager: null,
      issuerRegistry: null,
      isSupported: false,
      chainId,
    };
  }
}

// ─── Convenience hooks ────────────────────────────────────────
// Use these when you only need one address

export function usePlatformAMAddress(): Address | null {
  const { platformAccessManager } = useContracts();
  return platformAccessManager;
}

export function useTokenAMAddress(): Address | null {
  const { tokenAccessManager } = useContracts();
  return tokenAccessManager;
}

export function useIssuerRegistryAddress(): Address | null {
  const { issuerRegistry } = useContracts();
  return issuerRegistry;
}

export function useContractAddress(contractKey: string): Address | null {
  return getContractAddress(useChainId(), contractKey) as Address | null;
}
