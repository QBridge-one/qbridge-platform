"use client";

// ============================================================
// components/providers/privy-providers.tsx
//
// Privy provider tree — the analogue of web3auth-providers.tsx.
//
// Wallet-only role: Clerk stays the sole login. Privy authenticates the
// user from the Clerk session JWT via `customAuth.getCustomAccessToken`
// (we DO NOT call Privy's own login()), then provisions an MPC embedded
// wallet bound to the Clerk user. See config/privy.ts.
//
// Nesting is mandated by @privy-io/wagmi:
//   PrivyProvider > QueryClientProvider > WagmiProvider
// WagmiProvider + the wagmi config must come from @privy-io/wagmi.
// ============================================================

import { useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { useAuth } from "@clerk/nextjs";
import { privyAppId, isPrivyConfigured, basePrivyConfig } from "@/config/privy";
import { privyWagmiConfig } from "@/lib/privy-wagmi-config";
import { PrivyWalletStateSync } from "@/components/providers/privy-wallet-state-sync";
import { PrivyAutoBind } from "@/components/providers/privy-auto-bind";
import { WalletAutoDisconnect } from "@/components/providers/wallet-auto-disconnect";

const queryClient = new QueryClient();

export function PrivyProviders({ children }: { children: React.ReactNode }) {
  // Clerk owns identity. Privy reads the Clerk session token through this
  // callback; Privy auto-syncs its auth state to Clerk's. getToken() is
  // null when signed out → map to undefined for Privy's contract.
  const { getToken, isLoaded } = useAuth();

  const config = useMemo(
    () => ({
      ...basePrivyConfig,
      customAuth: {
        getCustomAccessToken: async () => (await getToken()) ?? undefined,
        isLoading: !isLoaded,
      },
    }),
    [getToken, isLoaded],
  );

  if (!isPrivyConfigured) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider appId={privyAppId} config={config}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={privyWagmiConfig}>
          <PrivyWalletStateSync />
          <PrivyAutoBind />
          <WalletAutoDisconnect />
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
