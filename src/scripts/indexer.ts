// ============================================================
// scripts/indexer.ts
//
// Entry point for the chain-role indexer worker. Run with:
//
//   npm run indexer            # bootstrap → backfill → watch (long-lived)
//   npm run indexer:once       # bootstrap → backfill → exit
//
// In production, deploy this as a separate long-running process
// (Railway worker / Fly machine / Docker container). It does NOT
// belong in Next.js (no serverless runtime — watchContractEvent
// requires a persistent connection).
//
// Required env:
//   DATABASE_URL                  → Postgres
//   NEXT_PUBLIC_SEPOLIA_RPC_URL   → RPC for backfill + watch
//   NEXT_PUBLIC_PLATFORM_AM_*     → AM addresses (bootstrap.ts seeds these)
//   NEXT_PUBLIC_TOKEN_AM_*
//
// Optional env:
//   INDEXER_START_BLOCK_SEPOLIA   → first block to scan
//   INDEXER_BACKFILL_CHUNK        → blocks per getLogs call (default 9500)
//   INDEXER_ONESHOT=1             → skip the live tail (used by :once script)
// ============================================================

// MUST be the first import — populates process.env before any module
// (notably @/lib/db) reads DATABASE_URL at init.
import "./_env";

import { INDEXER_CHAINS } from "@/lib/indexer/chains";
import { bootstrapAccessManagers } from "@/lib/indexer/bootstrap";
import { backfillAll } from "@/lib/indexer/backfill";
import { watchAll } from "@/lib/indexer/watch";

async function main() {
  console.log("[indexer] starting…");
  console.log(
    "[indexer] chains:",
    INDEXER_CHAINS.map((c) => c.chainId).join(", ") || "(none)",
  );

  await bootstrapAccessManagers();
  await backfillAll(INDEXER_CHAINS);

  if (process.env.INDEXER_ONESHOT === "1") {
    console.log("[indexer] oneshot complete — exiting");
    process.exit(0);
  }

  const stop = await watchAll(INDEXER_CHAINS);
  console.log("[indexer] watching — press Ctrl+C to stop");

  const shutdown = (sig: string) => {
    console.log(`[indexer] ${sig} — shutting down`);
    stop();
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[indexer] fatal:", err);
  process.exit(1);
});
