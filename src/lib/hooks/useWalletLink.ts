"use client";

// ============================================================
// lib/hooks/useWalletLink.ts
//
// Two-step flow:
//   1. POST /api/wallet/nonce  → server returns { nonce, message }
//   2. wallet signs message    → POST /api/wallet/link with signature
//
// Never imports vendor IdP SDKs. Wraps signing via wagmi
// (allowed by hard rules: wagmi-only state + signing).
// ============================================================

import { useCallback, useState } from "react";
import { useSignMessage } from "wagmi";
import { useWallet } from "./useWallet";

export interface UseWalletLinkReturn {
  isLinking: boolean;
  error: string | null;
  link: () => Promise<{ ok: boolean; address?: `0x${string}` }>;
  unlink: () => Promise<{ ok: boolean }>;
  reset: () => void;
}

export function useWalletLink(): UseWalletLinkReturn {
  const { address, isConnected } = useWallet();
  const { signMessageAsync } = useSignMessage();
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const link = useCallback(async () => {
    setError(null);
    if (!isConnected || !address) {
      setError("Connect a wallet first.");
      return { ok: false };
    }
    setIsLinking(true);
    try {
      const r = await fetch("/api/wallet/nonce", { method: "POST" });
      const d = (await r.json()) as { ok?: boolean; nonce?: string; message?: string; error?: string };
      if (!r.ok || !d.nonce || !d.message) {
        throw new Error(d.error ?? "Failed to get nonce");
      }
      const signature = await signMessageAsync({ message: d.message });
      const r2 = await fetch("/api/wallet/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature, nonce: d.nonce }),
      });
      const d2 = (await r2.json()) as { ok?: boolean; address?: string; error?: string };
      if (!r2.ok || !d2.ok) throw new Error(d2.error ?? "Link failed");
      return { ok: true, address: d2.address as `0x${string}` };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Wallet link failed";
      setError(msg);
      return { ok: false };
    } finally {
      setIsLinking(false);
    }
  }, [address, isConnected, signMessageAsync]);

  const unlink = useCallback(async () => {
    setError(null);
    setIsLinking(true);
    try {
      const r = await fetch("/api/wallet/link", { method: "DELETE" });
      const d = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !d.ok) throw new Error(d.error ?? "Unlink failed");
      return { ok: true };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unlink failed");
      return { ok: false };
    } finally {
      setIsLinking(false);
    }
  }, []);

  const reset = useCallback(() => setError(null), []);

  return { isLinking, error, link, unlink, reset };
}
