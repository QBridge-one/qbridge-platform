// ============================================================
// lib/indexer/watch.ts
//
// Live tail. Polls each chain every `pollMs` and calls backfillChain()
// to fetch and process any new logs between the cursor and head. We
// deliberately do NOT use viem's watchContractEvent because it relies
// on eth_newFilter / eth_getFilterChanges, which most public RPCs
// (including publicnode.com) drop between requests — "filter not found"
// every poll, zero events ever delivered.
//
// Reusing backfillChain gives us:
//   - one code path for catch-up and live tail
//   - idempotent writes (unique index on (am, tx, log_index))
//   - works against any RPC that supports eth_getLogs
// ============================================================

import type { IndexerChainConfig } from "./chains";
import { backfillChain } from "./backfill";

/** Default poll cadence. Sepolia blocks land every ~12 s, so a 30 s cadence
 *  still surfaces on-chain role changes in the ops UI within one tick of
 *  inclusion while drastically cutting:
 *   - free-RPC rate-limit consumption (publicnode etc. throttle aggressively),
 *   - Neon compute hours — most ticks short-circuit via lastSeenHead in
 *     backfill.ts, but the *ticks that do find new blocks* now happen
 *     6× less often. */
const DEFAULT_POLL_MS = 30_000;

/** Run forever, polling each chain in parallel. Returns a stop()
 *  function the script entrypoint calls on SIGINT/SIGTERM. */
export async function watchAll(
  chains: IndexerChainConfig[],
  pollMs: number = DEFAULT_POLL_MS,
): Promise<() => void> {
  let stopped = false;

  // One independent loop per chain so a slow/failing chain can't stall
  // the others. Each loop catches its own errors and retries.
  for (const cfg of chains) {
    void (async () => {
      console.log(
        `[watch] chain ${cfg.chainId}: polling every ${pollMs}ms via getLogs`,
      );
      while (!stopped) {
        try {
          await backfillChain(cfg);
        } catch (err) {
          console.error(`[watch] chain ${cfg.chainId}: poll failed`, err);
        }
        await sleep(pollMs);
      }
      console.log(`[watch] chain ${cfg.chainId}: stopped`);
    })();
  }

  return () => {
    stopped = true;
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
