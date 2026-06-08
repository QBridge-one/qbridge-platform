// ============================================================
// lib/rpc.ts
//
// RPC endpoint resolution for wagmi/viem transports. viem's built-in
// default public RPCs (used by a bare `http()`) are heavily rate-limited
// and fail silently — reads come back empty, which looks like "no data".
// Prefer an env-configured URL, else a reliable public node.
// ============================================================

const FALLBACK_RPC: Record<number, string> = {
  11155111: "https://ethereum-sepolia-rpc.publicnode.com",
  1: "https://ethereum-rpc.publicnode.com",
  137: "https://polygon-bor-rpc.publicnode.com",
};

/** Preferred RPC URL for a chain (env override → reliable public node). */
export function rpcUrl(chainId: number): string | undefined {
  const env: Record<number, string | undefined> = {
    11155111: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
    1: process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
    137: process.env.NEXT_PUBLIC_POLYGON_RPC_URL,
  };
  return env[chainId]?.trim() || FALLBACK_RPC[chainId];
}
