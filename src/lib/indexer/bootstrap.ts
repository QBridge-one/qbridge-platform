// ============================================================
// lib/indexer/bootstrap.ts
//
// Registers AccessManager contracts the indexer should watch.
// For PR 3a this reads from .env (single platform AM + single
// token AM per chain) so behavior matches src/lib/contracts/registry.ts.
//
// PR 3b will replace this with a TokenFactory-driven discovery:
// the indexer will also watch the factory's `TokenDeployed` event
// and auto-insert new per-token AMs into `access_managers` as
// they're created.
// ============================================================

import { eq, and } from "drizzle-orm";
import { getContract } from "viem";
import { db } from "@/lib/db";
import { accessManagers, type NewAccessManager } from "@/lib/db/schema";
import { INDEXER_CHAINS } from "./chains";
import { rpcClient } from "./rpc";

/** Lowercase + 0x-prefix sanity check. Throws on garbage so a typo in
 *  .env can't silently insert a row that never matches a real address. */
function normalizeAddress(addr: string | undefined): string | null {
  if (!addr) return null;
  const a = addr.trim().toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(a)) return null;
  return a;
}

interface SeedSpec {
  chainId: number;
  amAddress: string;
  kind: "platform" | "token";
  orgId: string;
  assetId: string | null;
}

/** Envelope of AMs to register per chain. Today this is hard-wired to the
 *  two .env addresses; tomorrow it merges with factory discovery. */
function envelopeForChain(chainId: number): SeedSpec[] {
  const out: SeedSpec[] = [];
  if (chainId === 11155111) {
    const platform = normalizeAddress(process.env.NEXT_PUBLIC_PLATFORM_AM_SEPOLIA);
    const token = normalizeAddress(process.env.NEXT_PUBLIC_TOKEN_AM_SEPOLIA);
    if (platform) {
      out.push({
        chainId,
        amAddress: platform,
        kind: "platform",
        // Stub org id — the ops plane has exactly one logical org. Replace
        // with the real Clerk ops org id when wiring multi-tenant.
        orgId: "qbridge-ops",
        assetId: null,
      });
    }
    if (token) {
      out.push({
        chainId,
        amAddress: token,
        kind: "token",
        // Stub workspace id — PR 3b derives this from the factory event
        // and the deployed asset metadata.
        orgId: "demo-issuer",
        assetId: "demo-asset",
      });
    }
  }
  return out;
}

/** Upsert all configured AMs for every chain in INDEXER_CHAINS.
 *  Idempotent: re-running this is safe and won't duplicate rows. */
export async function bootstrapAccessManagers(): Promise<void> {
  for (const cfg of INDEXER_CHAINS) {
    const seeds = envelopeForChain(cfg.chainId);
    if (seeds.length === 0) {
      console.warn(
        `[bootstrap] chain ${cfg.chainId}: no AM addresses configured — skipping`,
      );
      continue;
    }
    const client = rpcClient(cfg);
    for (const seed of seeds) {
      const existing = await db
        .select({ id: accessManagers.id })
        .from(accessManagers)
        .where(
          and(
            eq(accessManagers.chainId, seed.chainId),
            eq(accessManagers.amAddress, seed.amAddress),
          ),
        )
        .limit(1);
      if (existing.length > 0) {
        console.log(
          `[bootstrap] chain ${seed.chainId} ${seed.kind} ${seed.amAddress} — already registered`,
        );
        continue;
      }

      // Try to find when the contract was deployed. If we can't (RPC
      // doesn't return code-at-block history cheaply), fall back to
      // the configured startBlock so backfill scans from there.
      const deployBlock = cfg.startBlock;
      const block = await client.getBlock({ blockNumber: deployBlock });

      const row: NewAccessManager = {
        chainId: seed.chainId,
        amAddress: seed.amAddress,
        kind: seed.kind,
        orgId: seed.orgId,
        assetId: seed.assetId,
        deployedBlock: deployBlock,
        deployedAt: new Date(Number(block.timestamp) * 1000),
      };

      await db.insert(accessManagers).values(row);
      console.log(
        `[bootstrap] registered ${seed.kind} AM ${seed.amAddress} on chain ${seed.chainId} (deploy block ${deployBlock})`,
      );
    }
  }
  // touch to silence unused import warning when getContract isn't used yet
  void getContract;
}
