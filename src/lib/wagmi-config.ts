// ============================================================
// lib/wagmi-config.ts
// Wagmi config singleton for server-side imperative reads (compliance
// preflight, viem adapter) — NOT the wallet connector (that's the Privy
// WagmiProvider in lib/privy-wagmi-config.ts). Chain selection mirrors
// config/privy.ts: "mainnet" → ETH L1 + Polygon, else Sepolia.
// ============================================================

import { createConfig, http } from "@wagmi/core";
import { mainnet, sepolia, polygon } from "@wagmi/core/chains";
import { rpcUrl } from "@/lib/rpc";

const isMainnet = process.env.NEXT_PUBLIC_PRIVY_NETWORK === "mainnet";

const chains = isMainnet ? [mainnet, polygon] as const : [sepolia] as const;

const transports = Object.fromEntries(
  chains.map((chain) => [chain.id, http(rpcUrl(chain.id))])
) as Record<(typeof chains)[number]["id"], ReturnType<typeof http>>;

export const wagmiConfig = createConfig({
  chains,
  transports,
  ssr: true,
});
