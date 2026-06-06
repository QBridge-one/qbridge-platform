// ============================================================
// lib/privy-wagmi-config.ts
//
// Wagmi config for the Privy provider — the analogue of lib/wagmi-config.ts.
//
// IMPORTANT: `createConfig` (and `WagmiProvider`, used in
// privy-providers.tsx) MUST come from `@privy-io/wagmi`, not `wagmi`
// directly. The Privy wrapper sets `reconnectOnMount: false`, which is
// required for the embedded wallet to surface correctly as a connector.
//
// Privy embedded wallets then appear as standard wagmi connectors, so
// the existing wagmi-based code (transaction.service, generated contract
// hooks, SIWE signing) works unchanged against this config.
//
// Chain selection mirrors config/privy.ts and lib/wagmi-config.ts:
//   NEXT_PUBLIC_PRIVY_NETWORK=mainnet → ETH L1 + Polygon, else Sepolia.
// ============================================================

import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { mainnet, sepolia, polygon } from "viem/chains";

const isMainnet = process.env.NEXT_PUBLIC_PRIVY_NETWORK === "mainnet";

const chains = isMainnet ? ([mainnet, polygon] as const) : ([sepolia] as const);

const transports = Object.fromEntries(
  chains.map((chain) => [chain.id, http()]),
) as Record<(typeof chains)[number]["id"], ReturnType<typeof http>>;

export const privyWagmiConfig = createConfig({
  chains,
  transports,
});
