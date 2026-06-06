// ============================================================
// lib/adapters/wallet-binding/drizzle.adapter.ts
// Postgres-backed WalletBindingPort — the canonical store for a
// user's primary wallet. Activated whenever DATABASE_URL is set
// (see ./index.ts). Addresses are normalized to lowercase on write.
// ============================================================

import "server-only";

import { eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import { walletBindings } from "../../db/schema";
import type {
  WalletBindingPort,
  WalletBindingProvider,
} from "../../ports/wallet-binding.port";
import type { Address } from "../../core/types";

class DrizzleWalletBindingAdapter implements WalletBindingPort {
  async get(userId: string): Promise<Address | null> {
    const rows = await db
      .select()
      .from(walletBindings)
      .where(eq(walletBindings.userId, userId))
      .limit(1);
    return rows[0] ? (rows[0].address as Address) : null;
  }

  async getMany(userIds: string[]): Promise<Map<string, Address>> {
    const out = new Map<string, Address>();
    const unique = Array.from(new Set(userIds));
    if (unique.length === 0) return out;
    const rows = await db
      .select()
      .from(walletBindings)
      .where(inArray(walletBindings.userId, unique));
    for (const r of rows) out.set(r.userId, r.address as Address);
    return out;
  }

  async upsert(
    userId: string,
    address: Address,
    provider: WalletBindingProvider,
  ): Promise<void> {
    const addr = address.toLowerCase() as Address;
    await db
      .insert(walletBindings)
      .values({ userId, address: addr, provider })
      .onConflictDoUpdate({
        target: walletBindings.userId,
        set: { address: addr, provider, updatedAt: new Date() },
      });
  }

  async remove(userId: string): Promise<void> {
    await db.delete(walletBindings).where(eq(walletBindings.userId, userId));
  }
}

export const drizzleWalletBindingAdapter = new DrizzleWalletBindingAdapter();
