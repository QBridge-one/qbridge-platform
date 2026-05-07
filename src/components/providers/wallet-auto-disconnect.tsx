"use client";

// ============================================================
// components/providers/wallet-auto-disconnect.tsx
//
// Bridge between identity (Clerk) and wallet provider.
//
// When the user signs out of Clerk (any path: dashboard UserButton,
// landing-page sign-out, programmatic signOut), this hook detects
// the transition and disconnects the embedded wallet so the next
// visitor on the same browser starts fully clean. Without this,
// the wallet session would persist in localStorage and the next
// sign-in would silently inherit it.
//
// Lives inside <Web3AuthProviders> so it has access to the wagmi
// context and the wallet adapter's disconnect hook (via useWallet).
//
// Adapter-agnostic: the wallet side only goes through useWallet().
// Swapping Web3Auth for Alchemy/Turnkey requires no change here.
// ============================================================

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useWallet } from "@/lib/hooks/useWallet";

const HAS_CLERK_KEY = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function WalletAutoDisconnectInner() {
  const { isSignedIn, isLoaded } = useUser();
  const { isConnected, disconnect } = useWallet();
  const wasSignedInRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    const prev = wasSignedInRef.current;
    wasSignedInRef.current = !!isSignedIn;

    if (prev === true && !isSignedIn && isConnected) {
      disconnect();
    }
  }, [isSignedIn, isLoaded, isConnected, disconnect]);

  return null;
}

export function WalletAutoDisconnect() {
  if (!HAS_CLERK_KEY) return null;
  return <WalletAutoDisconnectInner />;
}
