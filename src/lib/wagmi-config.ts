// ============================================================
// lib/wagmi-config.ts
// Wagmi config singleton for adapters (imperative actions outside React).
// Chains match Web3Auth network: SAPPHIRE_DEVNET → sepolia, SAPPHIRE_MAINNET → mainnet + polygon.
// ============================================================

import { createConfig, http } from "@wagmi/core";
import { mainnet, sepolia, polygon } from "@wagmi/core/chains";

// Match config/web3auth.ts: mainnet env → SAPPHIRE_MAINNET, else SAPPHIRE_DEVNET
const isMainnet =
  process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK === "mainnet";

const chains = isMainnet ? [mainnet, polygon] as const : [sepolia] as const;

const transports = Object.fromEntries(
  chains.map((chain) => [chain.id, http()])
) as Record<(typeof chains)[number]["id"], ReturnType<typeof http>>;

export const wagmiConfig = createConfig({
  chains,
  transports,
  ssr: true,
});
