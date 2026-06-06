"use client";

// ============================================================
// lib/hooks/useWallet.ts
//
// THE SINGLE WALLET HOOK every client component uses.
// Returns a vendor-agnostic, domain-level API. Components must
// NEVER import @web3auth/modal/react, wagmi, @alchemy/aa, or any
// other vendor SDK directly. This file is the only allowed
// boundary between vendor SDKs and the rest of the app.
//
// Replaceability story:
//   - Today  : Privy (embedded MPC EOA via wagmi connector).
//   - Future : Alchemy Account Kit (smart account + passkey).
//   - Future : Turnkey (HSM-backed signer).
//
// To swap the wallet provider, only this file changes:
//   1. Add a new internal hook (e.g. useWalletAlchemy).
//   2. Update the WALLET_PROVIDER switch at the bottom of this file.
//   3. Mount the provider's React tree in /components/providers/*.
// Nothing in /components, /app, or /lib outside of this hook needs
// to be aware of the swap. The shape of UseWalletReturn is the
// stable contract.
// ============================================================

import { useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import {
  usePrivy,
  useWallets,
  useLogout,
  getEmbeddedConnectedWallet,
} from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import type { WalletState, Address, ChainId } from "../core/types";
import { isPrivyConfigured } from "@/config/privy";

export interface UseWalletReturn {
  state: WalletState;
  isConnected: boolean;
  isConnecting: boolean;
  address: Address | null;
  chainId: ChainId | null;
  isSmartAccount: boolean;
  isSafe: boolean;
  shortAddress: string | null;
  connect: () => void;
  disconnect: () => void;
}

// ─── Disconnected stub ───────────────────────────────────────
// Used when no wallet provider is configured (e.g., dev mode
// without NEXT_PUBLIC_PRIVY_APP_ID set). All actions are
// no-ops and the state is fully-disconnected. Lets the rest of
// the app render without a runtime error from missing provider.
function useWalletStub(): UseWalletReturn {
  const noop = useCallback(() => {}, []);
  return {
    state: {
      isConnected: false,
      address: null,
      chainId: null,
      walletType: "embedded",
      isSmartAccount: false,
      isSafe: false,
    },
    isConnected: false,
    isConnecting: false,
    address: null,
    chainId: null,
    isSmartAccount: false,
    isSafe: false,
    shortAddress: null,
    connect: noop,
    disconnect: noop,
  };
}

// ─── Privy implementation ────────────────────────────────────
// Privy embedded MPC wallet, authenticated via the Clerk session JWT
// (custom auth). The wallet is provisioned on login (createOnLogin) and
// surfaced as a wagmi connector, so address/chain come from wagmi.
// "Connect" has no modal: it just ensures the embedded wallet is wagmi's
// active account; "disconnect" is a Privy logout.
function useWalletPrivy(): UseWalletReturn {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const chainId = useChainId();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();
  const { logout } = useLogout();

  const embeddedAddress =
    (getEmbeddedConnectedWallet(wallets)?.address as Address | undefined) ??
    undefined;

  // The embedded wallet is the canonical wallet. Only surface "connected"
  // once wagmi's active account matches it — otherwise a stale/other account
  // flashes briefly before setActiveWallet() promotes the embedded wallet,
  // and signing could target the wrong address.
  const isActiveEmbedded =
    !!embeddedAddress &&
    !!wagmiAddress &&
    wagmiAddress.toLowerCase() === embeddedAddress.toLowerCase();

  const address: Address | null = isActiveEmbedded
    ? (wagmiAddress as Address)
    : null;
  const isConnected = isActiveEmbedded && wagmiConnected;

  const handleConnect = useCallback(() => {
    const embedded = getEmbeddedConnectedWallet(wallets);
    if (embedded) void setActiveWallet(embedded).catch(() => {});
  }, [wallets, setActiveWallet]);

  const handleDisconnect = useCallback(() => {
    void logout();
  }, [logout]);

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  const state: WalletState = {
    isConnected,
    address,
    chainId: chainId ?? null,
    walletType: "embedded",
    isSmartAccount: false,
    isSafe: false,
  };

  return {
    state,
    isConnected,
    // Initializing, or the embedded wallet exists but hasn't become wagmi's
    // active account yet (the window the flash-fix above hides).
    isConnecting:
      !ready || (authenticated && !!embeddedAddress && !isActiveEmbedded),
    address,
    chainId: chainId ?? null,
    isSmartAccount: false,
    isSafe: false,
    shortAddress,
    connect: handleConnect,
    disconnect: handleDisconnect,
  };
}

// ─── Provider switch (module-load constant — safe re. hooks rules) ──
// Stable across renders, so React's rules-of-hooks invariant holds:
// a given mount of useWallet always calls the same underlying hook.
export const useWallet: () => UseWalletReturn = isPrivyConfigured
  ? useWalletPrivy
  : useWalletStub;
