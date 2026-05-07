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
//   - Today  : Web3Auth (embedded EOA via wagmi connector).
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
  useWeb3AuthConnect,
  useWeb3AuthDisconnect,
} from "@web3auth/modal/react";
import type { WalletState, Address, ChainId } from "../core/types";
import { isWeb3AuthConfigured } from "@/config/web3auth";

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
// without NEXT_PUBLIC_WEB3AUTH_CLIENT_ID set). All actions are
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

// ─── Web3Auth implementation ─────────────────────────────────
function useWalletWeb3Auth(): UseWalletReturn {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, loading } = useWeb3AuthConnect();
  const { disconnect: web3AuthDisconnect } = useWeb3AuthDisconnect();

  const handleConnect = useCallback(() => {
    connect();
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    web3AuthDisconnect({ cleanup: true });
  }, [web3AuthDisconnect]);

  const state: WalletState = {
    isConnected,
    address: (address as Address) ?? null,
    chainId: chainId ?? null,
    walletType: "embedded",
    isSmartAccount: false,
    isSafe: false,
  };

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  return {
    state,
    isConnected,
    isConnecting: loading,
    address: (address as Address) ?? null,
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
export const useWallet: () => UseWalletReturn = isWeb3AuthConfigured
  ? useWalletWeb3Auth
  : useWalletStub;
