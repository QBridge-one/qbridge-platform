// ============================================================
// config/privy.ts
//
// Static Privy configuration — the analogue of config/web3auth.ts.
//
// Privy is the embedded-wallet provider ONLY. Clerk remains the sole
// login: Privy authenticates each user from the Clerk session JWT
// (JWT-based / "custom" auth) and provisions one MPC embedded wallet
// bound to the Clerk user (sub claim). No second login screen.
//
// The dynamic half of the config — `customAuth.getCustomAccessToken`,
// which needs the Clerk `getToken` hook — is assembled in
// components/providers/privy-providers.tsx, where React hooks are
// available. This file holds only the static, hook-free parts.
// ============================================================

import type { PrivyClientConfig } from "@privy-io/react-auth";
import { mainnet, sepolia, polygon } from "viem/chains";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

// Mirrors config/web3auth.ts: "mainnet" → ETH L1 + Polygon, else Sepolia devnet.
const isMainnet = process.env.NEXT_PUBLIC_PRIVY_NETWORK === "mainnet";

export const privyAppId = appId ?? "";

/** True once NEXT_PUBLIC_PRIVY_APP_ID is set. Gates the provider tree
 *  exactly like `isWeb3AuthConfigured` does for Web3Auth. */
export const isPrivyConfigured = Boolean(appId);

/**
 * Static Privy client config (everything except `customAuth`, which is
 * injected per-render in privy-providers.tsx). Keep chain selection in
 * lockstep with lib/privy-wagmi-config.ts.
 */
export const basePrivyConfig: Omit<PrivyClientConfig, "customAuth"> = {
  // One embedded EVM wallet per Clerk user, created on first login if
  // they don't already have one (idempotent → preserves one-user-one-wallet).
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
    // The embedded wallet is app-controlled (provisioned for this Clerk user),
    // so QBridge owns the signing UX. Suppress Privy's own confirmation modals
    // — otherwise the silent auto-link SIWE pops a "Sign message" dialog.
    // NOTE: this also makes on-chain transactions sign without Privy's modal;
    // QBridge's own transaction flow provides the user-facing confirmation.
    showWalletUIs: false,
  },
  supportedChains: isMainnet ? [mainnet, polygon] : [sepolia],
  defaultChain: isMainnet ? mainnet : sepolia,
};
