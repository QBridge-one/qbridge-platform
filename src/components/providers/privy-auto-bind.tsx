"use client";

// ============================================================
// components/providers/privy-auto-bind.tsx
//
// Records the user's Privy embedded wallet as their primary wallet,
// once, when it attaches. Posts the Privy identity token to
// /api/wallet/bind (server verifies + writes the canonical Postgres
// binding). Replaces the SIWE auto-link — no signature, no popup.
//
// Mounted inside the Privy provider tree (privy-providers.tsx) so both
// useWallet (embedded address) and useIdentityToken are in scope.
// Idempotent: the server upserts; we also guard per-address client-side.
// ============================================================

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/hooks/useWallet";
import { useWalletBind } from "@/lib/hooks/useWalletBind";

export function PrivyAutoBind() {
  const { isConnected, address } = useWallet();
  const { bind, hasToken } = useWalletBind();
  const router = useRouter();
  const boundFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address || !hasToken) return;
    if (boundFor.current === address) return; // already bound this address
    boundFor.current = address;
    void (async () => {
      const r = await bind();
      if (r.ok) {
        // Server components re-read primaryWallet from the binding store.
        router.refresh();
      } else {
        boundFor.current = null; // allow a retry on next change/mount
      }
    })();
  }, [isConnected, address, hasToken, bind, router]);

  return null;
}
