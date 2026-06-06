"use client";

// ============================================================
// lib/hooks/useWalletBind.ts
//
// Privy replacement for useWalletLink (SIWE). Sends the Privy identity
// token to /api/wallet/bind, where the server verifies it and records
// the embedded wallet as the user's primary wallet — no signature, no
// popup. Idempotent on the server (upsert).
//
// Privy-only: useIdentityToken requires PrivyProvider, so this hook is
// used inside the Privy provider tree (PrivyAutoBind), never in code
// that also runs under Web3Auth.
// ============================================================

import { useCallback } from "react";
import { useIdentityToken } from "@privy-io/react-auth";

export interface WalletBindResult {
  ok: boolean;
  address?: string;
}

export function useWalletBind() {
  const { identityToken } = useIdentityToken();

  const bind = useCallback(async (): Promise<WalletBindResult> => {
    if (!identityToken) return { ok: false };
    try {
      const res = await fetch("/api/wallet/bind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: identityToken }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        address?: string;
      };
      return { ok: res.ok && data?.ok === true, address: data?.address };
    } catch {
      return { ok: false };
    }
  }, [identityToken]);

  return { bind, hasToken: Boolean(identityToken) };
}
