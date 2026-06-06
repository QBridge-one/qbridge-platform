// ============================================================
// lib/container.ts
//
// Client-safe DI container. Picks the active WalletPort
// implementation based on NEXT_PUBLIC_WALLET_PROVIDER and assembles
// the application services that depend on it.
//
// THIS is the only place that imports concrete wallet adapters.
// Everything else imports port interfaces or this container.
//
// ─── Replaceability ─────────────────────────────────────────
// Privy is the active wallet provider. To swap it for Alchemy / Turnkey
// (or any other WalletPort implementation):
//
//   1. Implement the adapter under src/lib/adapters/wallet/.
//      (alchemy.adapter.ts is already stubbed for ERC-4337 smart
//       accounts — fill it in following its TODO comments.)
//   2. Add the new branch to the pickWalletAdapter() switch below.
//   3. In src/lib/hooks/useWallet.ts, add an internal hook
//      implementation for the new provider and gate the export
//      on the same env var.
//   4. In src/components/providers/, mount the provider's React tree
//      alongside privy-providers.tsx and select it in
//      wallet-providers.tsx.
//   5. (Optional) update gasPolicyAdapter / multisigAdapter if the
//      new wallet supports gas sponsorship or multisig flows that
//      the old one didn't.
//
// Identity / org / auth-webhook / wallet-binding / audit-log adapters
// are server-only — see container.server.ts.
// ============================================================

import { privyAdapter } from "./adapters/wallet/privy.adapter";
// import { alchemyAdapter } from "./adapters/wallet/alchemy.adapter";   // when implemented
// import { turnkeyAdapter } from "./adapters/wallet/turnkey.adapter";   // when implemented

import { viemAdapter } from "./adapters/blockchain/viem.adapter";

import {
  noSponsorshipAdapter,
  // AlchemyGasManagerAdapter,
} from "./adapters/gas-policy/adapters";

import {
  noMultisigAdapter,
  onChainComplianceAdapter,
  // SafeAdapter,
} from "./adapters/compliance/adapters";

import { TransactionService } from "./services/transaction.service";

import { memoryIntentAdapter } from "./adapters/intent/memory.adapter";
import { viemBroadcastAdapter } from "./adapters/broadcast/viem-server.adapter";

import type { WalletPort } from "./ports/wallet.port";

// ─── Wallet provider switch ──────────────────────────────────
// NEXT_PUBLIC_ so it's available on the client.
const WALLET_PROVIDER = (
  process.env.NEXT_PUBLIC_WALLET_PROVIDER ?? "privy"
).toLowerCase();

function pickWalletAdapter(): WalletPort {
  switch (WALLET_PROVIDER) {
    // case "alchemy":
    //   return alchemyAdapter;
    // case "turnkey":
    //   return turnkeyAdapter;
    case "privy":
    default:
      return privyAdapter; // Privy embedded MPC wallet — wagmi-compatible, Clerk JWT auth
  }
}

export const walletAdapter: WalletPort = pickWalletAdapter();
export const blockchainAdapter = viemAdapter;
export const gasPolicyAdapter = noSponsorshipAdapter;
export const multisigAdapter = noMultisigAdapter;
export const complianceAdapter = onChainComplianceAdapter;

// ─── Services ────────────────────────────────────────────────
export const transactionService = new TransactionService({
  walletPort: walletAdapter,
  blockchainPort: blockchainAdapter,
  gasPolicyPort: gasPolicyAdapter,
  multisigPort: multisigAdapter,
  compliancePort: complianceAdapter,
  confirmations: 1,
});

// ─── Re-exports for convenience ──────────────────────────────
export type { WalletPort } from "./ports/wallet.port";
export type { BlockchainPort } from "./ports/blockchain.port";

/** Server routes + PrivyWalletStateSync — only these may reach for the
 *  concrete wallet adapter (e.g. to inject the WagmiProvider config).
 *  Everything else uses `walletAdapter` (the WalletPort). */
export { memoryIntentAdapter, viemBroadcastAdapter, privyAdapter };
