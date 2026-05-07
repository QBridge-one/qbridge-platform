// ============================================================
// lib/ports/wallet-link.port.ts
// Binds an authenticated user (from IdentityPort) to a wallet
// address via signed-message proof (SIWE-style).
// ============================================================

import type { Address } from "../core/types";
import type { WalletLinkChallenge, WalletLinkProof } from "../core/identity.types";

export interface WalletLinkPort {
  /** Issue a fresh nonce + message for the given user id. */
  challenge(userId: string): Promise<WalletLinkChallenge>;
  /**
   * Verify the signature, ensure the nonce matches, persist the binding.
   * Throws DomainError "WALLET_LINK_INVALID" on any failure.
   */
  verifyAndLink(proof: WalletLinkProof): Promise<void>;
  /** Return the linked address for a user (or null). */
  getLinkedAddress(userId: string): Promise<Address | null>;
  /** Remove the binding. */
  unlink(userId: string): Promise<void>;
}
