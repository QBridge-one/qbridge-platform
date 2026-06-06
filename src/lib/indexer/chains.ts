// ============================================================
// lib/indexer/chains.ts
// Per-chain config the indexer needs: RPC URL, viem chain, and
// where to start backfilling from. Mirrors src/config/privy.ts
// so the indexer and the app talk to the same network.
// ============================================================

import { sepolia, mainnet, polygon, type Chain } from "viem/chains";

export interface IndexerChainConfig {
  chainId: number;
  chain: Chain;
  rpcUrl: string;
  /** Earliest block to scan if the indexer has no cursor yet. */
  startBlock: bigint;
  /** Max blocks per eth_getLogs call. Public RPCs cap this. */
  backfillChunk: bigint;
}

function num(name: string, fallback: bigint): bigint {
  const v = process.env[name];
  if (!v) return fallback;
  const n = BigInt(v);
  return n;
}

const DEFAULT_CHUNK = num("INDEXER_BACKFILL_CHUNK", BigInt(9500));

/** All chains the indexer should watch. Add a new entry per chain when
 *  you deploy AMs there. Keep in sync with src/lib/contracts/registry.ts. */
export const INDEXER_CHAINS: IndexerChainConfig[] = [
  {
    chainId: 11155111,
    chain: sepolia,
    rpcUrl:
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
      "https://ethereum-sepolia-rpc.publicnode.com",
    startBlock: num("INDEXER_START_BLOCK_SEPOLIA", BigInt(0)),
    backfillChunk: DEFAULT_CHUNK,
  },
  // Add MAINNET / POLYGON entries when you deploy there. Pattern:
  // {
  //   chainId: 1, chain: mainnet,
  //   rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL ?? "...",
  //   startBlock: num("INDEXER_START_BLOCK_MAINNET", 0n),
  //   backfillChunk: DEFAULT_CHUNK,
  // },
];

// Re-export for callers that want chain references.
export { sepolia, mainnet, polygon };
