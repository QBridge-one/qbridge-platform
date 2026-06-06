// ============================================================
// config/privy.ts
//
// Static Privy configuration. Privy is the embedded-wallet provider
// ONLY — Clerk remains the sole login: Privy authenticates each user
// from the Clerk session JWT (JWT-based / "custom" auth) and provisions
// one MPC embedded wallet bound to the Clerk user (sub claim). No second
// login screen.
//
// The dynamic half of the config — `customAuth.getCustomAccessToken`,
// which needs the Clerk `getToken` hook — is assembled in
// components/providers/privy-providers.tsx, where React hooks are
// available. This file holds only the static, hook-free parts.
// ============================================================

import type { PrivyClientConfig } from "@privy-io/react-auth";
import { mainnet, sepolia, polygon } from "viem/chains";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

// "mainnet" → ETH L1 + Polygon, else Sepolia devnet. Keep in lockstep
// with lib/privy-wagmi-config.ts.
const isMainnet = process.env.NEXT_PUBLIC_PRIVY_NETWORK === "mainnet";

export const privyAppId = appId ?? "";

/** True once NEXT_PUBLIC_PRIVY_APP_ID is set. Gates the provider tree
 *  and the useWallet/WalletStatus surfaces. */
export const isPrivyConfigured = Boolean(appId);

/** Opt in to Privy native gas sponsorship for on-chain sends (the adapter
 *  passes `sponsor: true` to useSendTransaction).
 *
 *  OFF by default — it's per-environment because it depends on dashboard
 *  setup and spends your gas budget. To use it client-side you must, in the
 *  Privy dashboard: enable gas sponsorship, select the chain(s), and turn on
 *  "Allow transactions from the client" (otherwise sends fail with "App
 *  secret is required…" and can only be sponsored server-side). Then set
 *  NEXT_PUBLIC_PRIVY_SPONSOR_GAS=true. When off, the wallet pays its own gas.
 *
 *  Production note: Privy rate-limits client-side sponsorship heavily and
 *  recommends sponsoring from your server for finer control — a future
 *  server-relay through /api/tx would route the sponsored send via the
 *  Node SDK + app secret. */
export const privySponsorGas =
  (process.env.NEXT_PUBLIC_PRIVY_SPONSOR_GAS ?? "false").toLowerCase() === "true";

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
    // Default to silent (no Privy modal) so the auto-bind SIWE-style signing
    // doesn't pop a dialog. On-chain SENDS override this per-call
    // (uiOptions.showWalletUIs: true in privy.adapter) to show an explicit
    // pre-sign confirmation. So: signing/binding is silent; writes confirm.
    showWalletUIs: false,
  },
  supportedChains: isMainnet ? [mainnet, polygon] : [sepolia],
  defaultChain: isMainnet ? mainnet : sepolia,
};
