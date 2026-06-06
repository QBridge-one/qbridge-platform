// ============================================================
// lib/ports/wallet-binding.port.ts
//
// Canonical "which wallet belongs to which user" store. This is the
// system of record for a user's primary wallet — owned by QBridge
// (Postgres), not the IdP. Replaces storing the binding in Clerk
// publicMetadata.
//
// For Privy embedded wallets the address is established server-side
// from a verified Privy identity token (no client-signed SIWE). The
// IdentityPort / OrganizationPort read primaryWallet from here.
// ============================================================

import type { Address } from "../core/types";

export type WalletBindingProvider = "privy" | "web3auth";

export interface WalletBindingPort {
  /** The user's primary wallet, or null if none bound. */
  get(userId: string): Promise<Address | null>;
  /** Batch variant for member lists — only present bindings are in the map. */
  getMany(userIds: string[]): Promise<Map<string, Address>>;
  /** Insert or replace the user's primary wallet binding. */
  upsert(
    userId: string,
    address: Address,
    provider: WalletBindingProvider,
  ): Promise<void>;
  /** Remove the user's binding. */
  remove(userId: string): Promise<void>;
}
