// ============================================================
// lib/adapters/wallet-binding/memory.adapter.ts
// In-process WalletBindingPort for fresh-clone / no-DATABASE_URL dev.
// Not persistent — lost on restart. ./index.ts picks this only when
// DATABASE_URL is unset.
// ============================================================

import type {
  WalletBindingPort,
  WalletBindingProvider,
} from "../../ports/wallet-binding.port";
import type { Address } from "../../core/types";

class MemoryWalletBindingAdapter implements WalletBindingPort {
  private store = new Map<string, Address>();

  async get(userId: string): Promise<Address | null> {
    return this.store.get(userId) ?? null;
  }

  async getMany(userIds: string[]): Promise<Map<string, Address>> {
    const out = new Map<string, Address>();
    for (const id of userIds) {
      const a = this.store.get(id);
      if (a) out.set(id, a);
    }
    return out;
  }

  async upsert(
    userId: string,
    address: Address,
    _provider: WalletBindingProvider,
  ): Promise<void> {
    this.store.set(userId, address.toLowerCase() as Address);
  }

  async remove(userId: string): Promise<void> {
    this.store.delete(userId);
  }
}

export const memoryWalletBindingAdapter = new MemoryWalletBindingAdapter();
