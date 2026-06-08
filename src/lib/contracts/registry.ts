// ============================================================
// lib/contracts/registry.ts
//
// Single source of truth for ALL deployed contract addresses.
// Keyed by chain ID so the app automatically uses the right
// address when the user switches networks.
//
// HOW TO ADD A NEW CONTRACT:
//   1. Add its address to .env.local (never hardcode in source)
//   2. Add the env var to the chain entry below
//   3. Export a typed getter if needed
//
// HOW TO ADD A NEW CHAIN:
//   1. Add a new chain ID entry to REGISTRY
//   2. Add env vars for that chain
//   3. Add the chain to lib/wagmi-config.ts
// ============================================================

// ─── Environment variables ────────────────────────────────────
// Add these to .env.local — never commit real addresses to source control.
//
// # Sepolia (chain 11155111)
// NEXT_PUBLIC_PLATFORM_AM_SEPOLIA=0x...
// NEXT_PUBLIC_TOKEN_AM_SEPOLIA=0x...
// NEXT_PUBLIC_ISSUER_REGISTRY_SEPOLIA=0x...
// NEXT_PUBLIC_TOKEN_REGISTRY_SEPOLIA=0x...
// NEXT_PUBLIC_FACTORY_SEPOLIA=0x...
//
// # Mainnet (chain 1)
// NEXT_PUBLIC_PLATFORM_AM_MAINNET=0x...
// NEXT_PUBLIC_TOKEN_AM_MAINNET=0x...
// NEXT_PUBLIC_ISSUER_REGISTRY_MAINNET=0x...
// NEXT_PUBLIC_TOKEN_REGISTRY_MAINNET=0x...
// NEXT_PUBLIC_FACTORY_MAINNET=0x...
//
// # Polygon (chain 137)
// NEXT_PUBLIC_PLATFORM_AM_POLYGON=0x...
// NEXT_PUBLIC_TOKEN_AM_POLYGON=0x...
// NEXT_PUBLIC_ISSUER_REGISTRY_POLYGON=0x...
// NEXT_PUBLIC_TOKEN_REGISTRY_POLYGON=0x...
// NEXT_PUBLIC_FACTORY_POLYGON=0x...

import { getAddress } from "viem";

type Address = `0x${string}`;

// Normalize an env address to EIP-55 checksum so viem accepts it
// regardless of how it was pasted (mixed/wrong-case env values otherwise
// make every read throw "Address must match its checksum counterpart").
// Returns "" for missing/invalid values so callers fail soft.
function norm(value: string | undefined): Address {
  const v = value?.trim();
  if (!v) return "" as Address;
  try {
    return getAddress(v) as Address;
  } catch {
    return "" as Address;
  }
}

interface ChainContracts {
  platformAccessManager: Address;
  tokenAccessManager: Address;
  issuerRegistry: Address;
  tokenRegistry: Address;
  factory: Address;
  // Add future contracts here as the platform grows:
  // complianceChecker?: Address;
  // proofOfReserve?: Address;
  [key: string]: Address | undefined;
}

type Registry = Partial<Record<number, ChainContracts>>;

// ─── Registry ─────────────────────────────────────────────────
const REGISTRY: Registry = {
  // Sepolia testnet
  11155111: {
    platformAccessManager: norm(process.env.NEXT_PUBLIC_PLATFORM_AM_SEPOLIA),
    tokenAccessManager: norm(process.env.NEXT_PUBLIC_TOKEN_AM_SEPOLIA),
    issuerRegistry: norm(process.env.NEXT_PUBLIC_ISSUER_REGISTRY_SEPOLIA),
    tokenRegistry: norm(process.env.NEXT_PUBLIC_TOKEN_REGISTRY_SEPOLIA),
    factory: norm(process.env.NEXT_PUBLIC_FACTORY_SEPOLIA),
  },

  // Ethereum mainnet
  1: {
    platformAccessManager: norm(process.env.NEXT_PUBLIC_PLATFORM_AM_MAINNET),
    tokenAccessManager: norm(process.env.NEXT_PUBLIC_TOKEN_AM_MAINNET),
    issuerRegistry: norm(process.env.NEXT_PUBLIC_ISSUER_REGISTRY_MAINNET),
    tokenRegistry: norm(process.env.NEXT_PUBLIC_TOKEN_REGISTRY_MAINNET),
    factory: norm(process.env.NEXT_PUBLIC_FACTORY_MAINNET),
  },

  // Polygon
  137: {
    platformAccessManager: norm(process.env.NEXT_PUBLIC_PLATFORM_AM_POLYGON),
    tokenAccessManager: norm(process.env.NEXT_PUBLIC_TOKEN_AM_POLYGON),
    issuerRegistry: norm(process.env.NEXT_PUBLIC_ISSUER_REGISTRY_POLYGON),
    tokenRegistry: norm(process.env.NEXT_PUBLIC_TOKEN_REGISTRY_POLYGON),
    factory: norm(process.env.NEXT_PUBLIC_FACTORY_POLYGON),
  },
};

// ─── Accessor ─────────────────────────────────────────────────
// Returns all contract addresses for a given chain.
// Throws clearly if the chain is not configured — fail fast.
export function getContracts(chainId: number): ChainContracts {
  const contracts = REGISTRY[chainId];

  if (!contracts) {
    throw new Error(
      `Contract registry: chain ${chainId} is not configured. ` +
      `Add it to lib/contracts/registry.ts and set env vars.`,
    );
  }

  // Warn in dev if any address is missing (env var not set)
  if (process.env.NODE_ENV === "development") {
    for (const [key, value] of Object.entries(contracts)) {
      const v = value as string | undefined;
      if (!v || v.trim() === "") {
        console.warn(
          `[registry] ${key} address is not set for chain ${chainId}. ` +
          `Set the env var in .env.local.`,
        );
      }
    }
  }

  return contracts;
}

// ─── Convenience getters ──────────────────────────────────────
export function getPlatformAMAddress(chainId: number): Address {
  return getContracts(chainId).platformAccessManager;
}

export function getTokenAMAddress(chainId: number): Address {
  return getContracts(chainId).tokenAccessManager;
}

export function getIssuerRegistryAddress(chainId: number): Address {
  return getContracts(chainId).issuerRegistry;
}

export function getTokenRegistryAddress(chainId: number): Address {
  return getContracts(chainId).tokenRegistry;
}

export function getFactoryAddress(chainId: number): Address {
  return getContracts(chainId).factory;
}

export function getContractAddress(chainId: number, contractKey: string): Address | null {
  try {
    const contracts = getContracts(chainId);
    const raw = contracts[contractKey] as string | undefined;
    if (!raw || raw.trim() === "") return null;
    return raw as Address;
  } catch {
    return null;
  }
}

// ─── Supported chains ─────────────────────────────────────────
export const SUPPORTED_CHAINS = Object.keys(REGISTRY).map(Number);

export function isChainSupported(chainId: number): boolean {
  return chainId in REGISTRY;
}
