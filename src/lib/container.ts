// ============================================================
// lib/container.ts
//
// Dependency injection container.
// THIS is the only place that imports concrete adapters.
// Everything else imports port interfaces or this container.
//
// To swap Web3Auth → Alchemy:
//   1. Change walletAdapter from web3AuthAdapter to alchemyAdapter
//   2. Change gasPolicyAdapter from noSponsorshipAdapter to alchemyGasManagerAdapter
//   3. Nothing else changes.
// ============================================================

import { web3AuthAdapter } from "./adapters/wallet/web3auth.adapter";
// import { alchemyAdapter } from "./adapters/wallet/alchemy.adapter"; // future

import { viemAdapter } from "./adapters/blockchain/viem.adapter";

import {
  noSponsorshipAdapter,
  // AlchemyGasManagerAdapter,   // future
} from "./adapters/gas-policy/adapters";

import {
  noMultisigAdapter,
  onChainComplianceAdapter,
  // SafeAdapter,                 // future
} from "./adapters/compliance/adapters";

import { TransactionService } from "./services/transaction.service";

import { memoryIntentAdapter } from "./adapters/intent/memory.adapter";
import { viemBroadcastAdapter } from "./adapters/broadcast/viem-server.adapter";

// ─── Active adapters ─────────────────────────────────────────
// Change these lines only — nothing else in the codebase needs to change.
//
// NOTE: this file is client-safe. Identity / organization /
// auth-webhook / wallet-link / audit-log adapters are server-only
// (they use next/headers, server-only imports, or vendor SDKs that
// pull in node:async_hooks). Those live in `./container.server.ts`.

export const walletAdapter = web3AuthAdapter;
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

/** Server routes + WalletStateSync — only these may use concrete adapter APIs beyond ports. */
export { memoryIntentAdapter, viemBroadcastAdapter, web3AuthAdapter };
