// ============================================================
// lib/indexer/rpc.ts
// Shared viem PublicClient cache keyed by chain id. The indexer
// makes a lot of getLogs/getBlock calls in tight loops; reusing
// one client per chain keeps connection overhead minimal.
// ============================================================

import { createPublicClient, http, type PublicClient } from "viem";
import type { IndexerChainConfig } from "./chains";

const clients = new Map<number, PublicClient>();

export function rpcClient(cfg: IndexerChainConfig): PublicClient {
  const cached = clients.get(cfg.chainId);
  if (cached) return cached;
  const client = createPublicClient({
    chain: cfg.chain,
    transport: http(cfg.rpcUrl, {
      // Conservative retry policy — public RPCs throttle aggressively.
      retryCount: 3,
      retryDelay: 500,
      timeout: 20_000,
    }),
  });
  clients.set(cfg.chainId, client);
  return client;
}
