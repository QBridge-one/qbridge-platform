"use client";

// ============================================================
// lib/hooks/useWallet.ts
//
// The single hook every component uses for wallet state.
// Uses wagmi hooks internally (reactive, fast) but
// exposes a clean domain-level API — no wagmi types leak out.
//
// Components import THIS, not useWeb3AuthConnect directly.
// When Alchemy adapter replaces Web3Auth, only this hook changes.
// ============================================================

import { useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import {
  useWeb3AuthConnect,
  useWeb3AuthDisconnect,
} from "@web3auth/modal/react";
import type { WalletState, Address, ChainId } from "../core/types";

export interface UseWalletReturn {
  // ── State ─────────────────────────────────────────────────
  state: WalletState;
  isConnected: boolean;
  isConnecting: boolean;
  address: Address | null;
  chainId: ChainId | null;
  isSmartAccount: boolean;
  isSafe: boolean;
  shortAddress: string | null;

  // ── Actions ───────────────────────────────────────────────
  connect: () => void;
  disconnect: () => void;
}

export function useWallet(): UseWalletReturn {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Web3Auth-specific hooks — when Alchemy replaces Web3Auth,
  // swap these two lines only
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
