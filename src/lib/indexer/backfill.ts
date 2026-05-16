// ============================================================
// lib/indexer/backfill.ts
//
// Catches the DB up to chain head by walking eth_getLogs in
// fixed-size windows. Cursor lives in indexer_cursors so a
// restart resumes where the previous run left off.
//
// Algorithm per chain:
//   1. Read or initialize the per-chain cursor.
//   2. Fetch chain head.
//   3. Walk [cursor+1, head] in chunks of cfg.backfillChunk blocks.
//   4. For each chunk, getLogs filtered by AM addresses + event topics,
//      then call processLog() per log inside a per-block timestamp cache.
//   5. Advance the cursor after each chunk so a crash mid-walk only
//      re-processes one chunk (which is idempotent anyway).
//
// `processLog` is idempotent, so re-running backfill from an earlier
// block on purpose is a safe way to recover from data corruption.
// ============================================================

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  accessManagers,
  indexerCursors,
  type AccessManagerRow,
} from "@/lib/db/schema";
import type { IndexerChainConfig } from "./chains";
import { rpcClient } from "./rpc";
import { ACCESS_MANAGER_EVENTS } from "./abi";
import { processLog } from "./process-event";
import type { Log, AbiEvent } from "viem";

// parseAbi returns a discriminated union of literal event types. viem's
// getLogs/watchEvent both accept a plain AbiEvent[], so widen here once.
const EVENT_ABIS = ACCESS_MANAGER_EVENTS as readonly AbiEvent[];

async function getOrInitCursor(
  chainId: number,
  fallback: bigint,
): Promise<bigint> {
  const existing = await db
    .select({ b: indexerCursors.lastIndexedBlock })
    .from(indexerCursors)
    .where(eq(indexerCursors.chainId, chainId))
    .limit(1);
  if (existing[0]) return existing[0].b;
  await db.insert(indexerCursors).values({
    chainId,
    lastIndexedBlock: fallback,
  });
  return fallback;
}

async function setCursor(chainId: number, block: bigint): Promise<void> {
  await db
    .update(indexerCursors)
    .set({
      lastIndexedBlock: block,
      updatedAt: sql`now()`,
    })
    .where(eq(indexerCursors.chainId, chainId));
}

/** Cache block.timestamp lookups within a single backfill run to avoid
 *  hammering the RPC. Cleared between chunks to keep memory bounded. */
class BlockTimestampCache {
  private cache = new Map<bigint, number>();
  constructor(
    private readonly client: ReturnType<typeof rpcClient>,
  ) {}
  async get(blockNumber: bigint): Promise<number> {
    const hit = this.cache.get(blockNumber);
    if (hit !== undefined) return hit;
    const block = await this.client.getBlock({ blockNumber });
    const ts = Number(block.timestamp);
    this.cache.set(blockNumber, ts);
    return ts;
  }
  clear() {
    this.cache.clear();
  }
}

/** Backfill a single chain. Returns the new cursor value (== chain head). */
export async function backfillChain(cfg: IndexerChainConfig): Promise<bigint> {
  const client = rpcClient(cfg);
  const ams = await db
    .select()
    .from(accessManagers)
    .where(eq(accessManagers.chainId, cfg.chainId));

  if (ams.length === 0) {
    console.warn(
      `[backfill] chain ${cfg.chainId}: no AMs registered — nothing to do`,
    );
    return BigInt(0);
  }

  const addressToAm = new Map<string, AccessManagerRow>();
  for (const am of ams) addressToAm.set(am.amAddress, am);
  const addresses = ams.map((am) => am.amAddress) as `0x${string}`[];

  // Start from the cursor, OR from the earliest AM deploy block if the
  // cursor is behind (a new AM was registered after the cursor moved on).
  const cursorAtStart = await getOrInitCursor(cfg.chainId, cfg.startBlock);
  const earliestAmBlock = ams.reduce(
    (min, am) => (am.deployedBlock < min ? am.deployedBlock : min),
    ams[0].deployedBlock,
  );
  const ONE = BigInt(1);
  let from =
    cursorAtStart < earliestAmBlock ? earliestAmBlock : cursorAtStart + ONE;

  const head = await client.getBlockNumber();
  if (from > head) {
    // Already caught up — stay quiet so the watch loop doesn't spam logs.
    return head;
  }

  // Only announce when there's a meaningful range to scan. Single-block
  // catches during the tail aren't worth a line each.
  if (head - from > BigInt(1)) {
    console.log(
      `[backfill] chain ${cfg.chainId}: ${from} → ${head} across ${addresses.length} AM(s)`,
    );
  }

  const tsCache = new BlockTimestampCache(client);
  while (from <= head) {
    const windowEnd = from + cfg.backfillChunk - ONE;
    const to = windowEnd > head ? head : windowEnd;

    const logs = await client.getLogs({
      address: addresses,
      events: EVENT_ABIS as AbiEvent[],
      fromBlock: from,
      toBlock: to,
    });

    if (logs.length > 0) {
      console.log(
        `[backfill] chain ${cfg.chainId} ${from}-${to}: ${logs.length} log(s)`,
      );
    }

    // Process strictly in chain order so any cross-event ordering
    // assumptions (e.g. grant → revoke in same chunk) hold.
    logs.sort((a: Log, b: Log) => {
      if (a.blockNumber! === b.blockNumber!) {
        return Number(a.logIndex! - b.logIndex!);
      }
      return Number(a.blockNumber! - b.blockNumber!);
    });

    for (const log of logs) {
      const am = addressToAm.get(log.address.toLowerCase());
      if (!am) continue;
      const ts = await tsCache.get(log.blockNumber!);
      await processLog(log, {
        accessManagerId: am.id,
        blockTimestampSec: ts,
      });
    }

    await setCursor(cfg.chainId, to);
    from = to + ONE;
    tsCache.clear();
  }

  return head;
}

/** Backfill every configured chain in order. */
export async function backfillAll(
  chains: IndexerChainConfig[],
): Promise<void> {
  for (const cfg of chains) {
    await backfillChain(cfg);
  }
}
