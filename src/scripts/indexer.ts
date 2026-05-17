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

import * as http from "node:http";
import { INDEXER_CHAINS } from "@/lib/indexer/chains";
import { bootstrapAccessManagers } from "@/lib/indexer/bootstrap";
import { backfillAll } from "@/lib/indexer/backfill";
import { watchAll } from "@/lib/indexer/watch";

/**
 * Railway / Render / Fly set `$PORT` and probe HTTP `/` almost immediately after
 * boot. Bind and **wait until the TCP listen succeeds** before any heavy work
 * (Postgres bootstrap, RPC); otherwise probes race ahead of `.listen()` and
 * Railway reports "service unavailable" for five minutes straight.
 */
function bindHostHealthProbe(): Promise<() => void> {
  const raw = process.env.PORT?.trim();
  if (!raw) return Promise.resolve(() => {});

  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    console.warn("[indexer] ignoring invalid PORT=", raw);
    return Promise.resolve(() => {});
  }

  return new Promise((resolve, reject) => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("ok\n");
    });

    server.once("error", reject);
    server.listen(port, "0.0.0.0", () => {
      console.log(`[indexer] probe listening on 0.0.0.0:${port}`);
      resolve(() => {
        server.close((err) => {
          if (err) console.warn("[indexer] probe shutdown:", err.message);
        });
      });
    });
  });
}

async function main() {
  const stopHealthProbe = await bindHostHealthProbe();
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
    stopHealthProbe();
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[indexer] fatal:", err);
  process.exit(1);
});
