"use client";

// ============================================================
// components/providers/privy-wallet-state-sync.tsx
//
// Bridges Privy/wagmi state into the PrivyWalletAdapter. Must live
// inside the <WagmiProvider> in privy-providers.tsx.
//
// Three jobs:
//   1. Promote the embedded wallet to wagmi's active account so
//      useAccount() (and the app's reads) resolve to it.
//   2. Inject the embedded wallet's EIP-1193 provider into the adapter
//      so signing / sending go through the Privy wallet (MPC), not a
//      read-only RPC transport. See privy.adapter.ts.
//   3. Mirror wagmi's reactive state (address/chain/connected) into the
//      adapter for getAddress()/isReady().
// ============================================================

import { useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import {
  usePrivy,
  useWallets,
  useSendTransaction,
  getEmbeddedConnectedWallet,
} from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { privyAdapter } from "@/lib/container";

export function PrivyWalletStateSync() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();
  const { sendTransaction } = useSendTransaction();

  // 1. Promote the embedded wallet to wagmi's active account.
  useEffect(() => {
    if (!ready || !authenticated) return;
    const embedded = getEmbeddedConnectedWallet(wallets);
    if (embedded && embedded.address.toLowerCase() !== address?.toLowerCase()) {
      void setActiveWallet(embedded).catch(() => {});
    }
  }, [ready, authenticated, wallets, address, setActiveWallet]);

  // 2. Inject the embedded wallet's EIP-1193 provider into the adapter so
  //    sign/send hit the Privy signer (MPC), not the read-only RPC.
  useEffect(() => {
    const embedded = getEmbeddedConnectedWallet(wallets);
    if (!embedded) {
      privyAdapter.setProvider(null);
      return;
    }
    let cancelled = false;
    void embedded
      .getEthereumProvider()
      .then((provider) => {
        if (!cancelled) privyAdapter.setProvider(provider);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [wallets]);

  // 2b. Inject Privy's native send fn (gas sponsorship + confirm UI).
  useEffect(() => {
    privyAdapter.setPrivySendTransaction((input, options) =>
      sendTransaction(input, options),
    );
    return () => privyAdapter.setPrivySendTransaction(null);
  }, [sendTransaction]);

  // 3. Mirror wagmi reactive state into the adapter.
  useEffect(() => {
    privyAdapter.updateState({
      isConnected,
      address: (address as `0x${string}`) ?? null,
      chainId: chainId ?? null,
      walletType: "embedded",
      isSmartAccount: false,
      isSafe: false,
    });
  }, [isConnected, address, chainId]);

  return null;
}
