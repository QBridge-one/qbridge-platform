"use client";

// ============================================================
// components/providers/wallet-state-sync.tsx
//
// Bridges wagmi's reactive state into the Web3AuthAdapter singleton.
// Must live inside <WagmiProvider> in web3auth-providers.tsx.
//
// IMPORTANT: Injects the WagmiProvider config into the adapter so wagmi
// core actions (sendTransaction, etc.) use the Web3Auth connector.
// Without this, "Connector not connected" occurs.
// ============================================================

import { useEffect } from "react";
import { useAccount, useChainId, useConfig } from "wagmi";
import { web3AuthAdapter } from "@/lib/container";

export function WalletStateSync() {
  const config = useConfig();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    web3AuthAdapter.setWagmiConfig(config);
  }, [config]);

  useEffect(() => {
    web3AuthAdapter.updateState({
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
