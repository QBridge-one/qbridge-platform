"use client";

// ============================================================
// components/providers/privy-wallet-state-sync.tsx
//
// Privy analogue of wallet-state-sync.tsx. Must live inside the
// <WagmiProvider> in privy-providers.tsx.
//
// Two jobs:
//   1. Inject the WagmiProvider config into the PrivyWalletAdapter so
//      wagmi core actions (sendTransaction, etc.) use the embedded-wallet
//      connector. Without this → "Connector not connected".
//   2. Once the user is authenticated (via Clerk JWT) and the embedded
//      wallet exists, set it as the active wagmi wallet so useAccount()
//      and the core actions resolve to it. The wallet is created by
//      Privy's createOnLogin — there is no connect modal.
// ============================================================

import { useEffect } from "react";
import { useAccount, useChainId, useConfig } from "wagmi";
import { usePrivy, useWallets, getEmbeddedConnectedWallet } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { privyAdapter } from "@/lib/container";

export function PrivyWalletStateSync() {
  const config = useConfig();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  useEffect(() => {
    privyAdapter.setWagmiConfig(config);
  }, [config]);

  // Promote the embedded wallet to wagmi's active account once it exists.
  useEffect(() => {
    if (!ready || !authenticated) return;
    const embedded = getEmbeddedConnectedWallet(wallets);
    if (embedded && embedded.address.toLowerCase() !== address?.toLowerCase()) {
      void setActiveWallet(embedded).catch(() => {});
    }
  }, [ready, authenticated, wallets, address, setActiveWallet]);

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
