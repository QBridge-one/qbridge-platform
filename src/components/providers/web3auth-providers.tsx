"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Web3AuthProvider } from "@web3auth/modal/react";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import {
  web3AuthContextConfig,
  isWeb3AuthConfigured,
} from "@/config/web3auth";
import { WalletStateSync } from "@/components/providers/wallet-state-sync";
import { WalletAutoDisconnect } from "@/components/providers/wallet-auto-disconnect";

const queryClient = new QueryClient();

export function Web3AuthProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isWeb3AuthConfigured) {
    return <>{children}</>;
  }

  return (
    <Web3AuthProvider config={web3AuthContextConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
          <WalletStateSync />
          <WalletAutoDisconnect />
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}
