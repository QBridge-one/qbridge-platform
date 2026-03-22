"use client";

// ============================================================
// lib/hooks/useContracts.ts
//
// The single hook every component uses to get contract addresses.
// Automatically returns addresses for the user's current chain.
// Returns null addresses if chain is not supported — UI handles gracefully.
//
// Usage:
//   const { platformAccessManager, tokenAccessManager } = useContracts()
//   // use in hook args — wagmi skips call if address is null
// ============================================================

import { useChainId } from "wagmi";
import { getContractAddress, getContracts, isChainSupported } from "@/lib/contracts/registry";

type Address = `0x${string}`;

export interface ContractAddresses {
  platformAccessManager: Address | null;
  tokenAccessManager: Address | null;
  // Add future contracts here as the platform grows
  isSupported: boolean;
  chainId: number;
}

// When Web3Auth isn't initialized yet, wagmi defaults to mainnet (chain 1).
// If we're on SAPPHIRE_DEVNET (Sepolia only), use Sepolia as fallback.
const isDevnet = process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK !== "mainnet";
const FALLBACK_CHAIN_ID = isDevnet ? 11155111 : 1;

export function useContracts(): ContractAddresses {
  let chainId = useChainId();

  // Use fallback when wagmi reports mainnet but we're configured for devnet
  if (chainId === 1 && isDevnet) {
    chainId = FALLBACK_CHAIN_ID;
  }

  if (!isChainSupported(chainId)) {
    return {
      platformAccessManager: null,
      tokenAccessManager: null,
      isSupported: false,
      chainId,
    };
  }

  try {
    const contracts = getContracts(chainId);
    return {
      platformAccessManager: contracts.platformAccessManager || null,
      tokenAccessManager: contracts.tokenAccessManager || null,
      isSupported: true,
      chainId,
    };
  } catch {
    return {
      platformAccessManager: null,
      tokenAccessManager: null,
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

export function useContractAddress(contractKey: string): Address | null {
  let chainId = useChainId();

  if (chainId === 1 && isDevnet) {
    chainId = FALLBACK_CHAIN_ID;
  }

  return getContractAddress(chainId, contractKey) as Address | null;
}
