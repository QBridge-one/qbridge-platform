// ============================================================
// lib/adapters/wallet-link/memory.adapter.ts
// Verifies a SIWE-style proof via viem.verifyMessage and stores
// the binding in-process. Replace with DB-backed adapter later.
// ============================================================

import { verifyMessage } from "viem";
import type { Address } from "../../core/types";
import type { WalletLinkPort } from "../../ports/wallet-link.port";
import type { WalletLinkChallenge, WalletLinkProof } from "../../core/identity.types";
import { walletLinkInvalid } from "../../core/errors";
import { memoryOrganizationStore } from "../organization/memory.store";

const NONCE_TTL_MS = 5 * 60 * 1000;

interface ChallengeRecord {
  nonce: string;
  message: string;
  expiresAt: number;
}

class MemoryWalletLinkAdapter implements WalletLinkPort {
  private challenges = new Map<string, ChallengeRecord>(); // userId → record
  private bindings = new Map<string, Address>();           // userId → address

  private buildMessage(userId: string, nonce: string): string {
    return [
      "QBridge wants to link your wallet to this account.",
      "",
      `User ID: ${userId}`,
      `Nonce: ${nonce}`,
      `Issued: ${new Date().toISOString()}`,
    ].join("\n");
  }

  async challenge(userId: string): Promise<WalletLinkChallenge> {
    const nonce = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    const expiresAt = Date.now() + NONCE_TTL_MS;
    const message = this.buildMessage(userId, nonce);
    this.challenges.set(userId, { nonce, message, expiresAt });
    return { nonce, message, expiresAt };
  }

  async verifyAndLink(proof: WalletLinkProof): Promise<void> {
    const rec = this.challenges.get(proof.userId);
    if (!rec) throw walletLinkInvalid("No active challenge for this user.");
    if (rec.nonce !== proof.nonce) throw walletLinkInvalid("Nonce mismatch.");
    if (Date.now() > rec.expiresAt) {
      this.challenges.delete(proof.userId);
      throw walletLinkInvalid("Challenge expired. Request a new one.");
    }
    let ok = false;
    try {
      ok = await verifyMessage({
        address: proof.address,
        message: rec.message,
        signature: proof.signature,
      });
    } catch (err) {
      throw walletLinkInvalid(err instanceof Error ? err.message : "verify failed");
    }
    if (!ok) throw walletLinkInvalid("Signature did not match address.");
    this.challenges.delete(proof.userId);
    this.bindings.set(proof.userId, proof.address);
    memoryOrganizationStore.setPrimaryWallet(proof.userId, proof.address);
  }

  async getLinkedAddress(userId: string): Promise<Address | null> {
    return this.bindings.get(userId) ?? null;
  }

  async unlink(userId: string): Promise<void> {
    this.bindings.delete(userId);
    memoryOrganizationStore.setPrimaryWallet(userId, null);
  }
}

export const memoryWalletLinkAdapter = new MemoryWalletLinkAdapter();
