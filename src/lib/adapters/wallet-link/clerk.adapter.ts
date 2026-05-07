// ============================================================
// lib/adapters/wallet-link/clerk.adapter.ts
//
// SIWE-style wallet binding that persists the result into the
// Clerk user's publicMetadata.primaryWallet, so the link survives
// across browsers, devices, and server restarts (in contrast to
// the memory adapter which only keeps the binding in process).
//
// Nonces are kept in process memory — they're short-lived (5 min)
// and only meaningful between issuance and verification, so that's
// fine for single-instance dev / preview. For multi-instance
// production, swap this for a Redis-backed store.
//
// Adapter-agnostic from the wallet's point of view: the verifier
// uses viem.verifyMessage which works for any signer that produces
// an EIP-191 signature (Web3Auth EOA today; Alchemy smart account
// via ERC-1271 / Turnkey HSM signer tomorrow — see note below).
//
// NOTE on smart accounts: ERC-4337 smart accounts may sign via
// ERC-1271 contract signatures, not EIP-191. If/when we move to
// Alchemy or another smart-account adapter, replace verifyMessage
// with publicClient.verifyMessage (which dispatches to ERC-1271
// for contract accounts) — that change is local to this file.
// ============================================================

import "server-only";

import { verifyMessage } from "viem";
import { clerkClient } from "@clerk/nextjs/server";
import type { WalletLinkPort } from "../../ports/wallet-link.port";
import type {
  WalletLinkChallenge,
  WalletLinkProof,
} from "../../core/identity.types";
import type { Address } from "../../core/types";
import { walletLinkInvalid } from "../../core/errors";

const NONCE_TTL_MS = 5 * 60 * 1000;

interface ChallengeRecord {
  nonce: string;
  message: string;
  expiresAt: number;
}

class ClerkWalletLinkAdapter implements WalletLinkPort {
  private challenges = new Map<string, ChallengeRecord>();

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

    const cc = await clerkClient();
    const u = await cc.users.getUser(proof.userId);
    const existing =
      typeof u.publicMetadata === "object" && u.publicMetadata !== null
        ? (u.publicMetadata as Record<string, unknown>)
        : {};
    await cc.users.updateUser(proof.userId, {
      publicMetadata: {
        ...existing,
        primaryWallet: proof.address,
      },
    });
  }

  async getLinkedAddress(userId: string): Promise<Address | null> {
    const cc = await clerkClient();
    const u = await cc.users.getUser(userId);
    const meta = u.publicMetadata as { primaryWallet?: unknown } | undefined;
    const pw = meta?.primaryWallet;
    if (typeof pw === "string" && /^0x[a-fA-F0-9]{40}$/.test(pw)) {
      return pw as Address;
    }
    return null;
  }

  async unlink(userId: string): Promise<void> {
    const cc = await clerkClient();
    const u = await cc.users.getUser(userId);
    const existing =
      typeof u.publicMetadata === "object" && u.publicMetadata !== null
        ? { ...(u.publicMetadata as Record<string, unknown>) }
        : {};
    delete existing.primaryWallet;
    await cc.users.updateUser(userId, { publicMetadata: existing });
  }
}

export const clerkWalletLinkAdapter = new ClerkWalletLinkAdapter();
