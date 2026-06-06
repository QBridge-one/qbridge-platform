// ============================================================
// lib/adapters/wallet-binding/index.ts
//
// Selects the active WalletBindingPort: Postgres when DATABASE_URL is
// set, in-memory otherwise (mirrors the DB_BACKED switch in
// container.server.ts for audit / notifications).
//
// Lives in its own module (not container.server.ts) so the Clerk
// identity / organization adapters can import the binding reader
// directly without a circular import through the container.
// ============================================================

import { drizzleWalletBindingAdapter } from "./drizzle.adapter";
import { memoryWalletBindingAdapter } from "./memory.adapter";
import type { WalletBindingPort } from "../../ports/wallet-binding.port";

const DB_BACKED = Boolean(process.env.DATABASE_URL?.trim());

export const walletBindingAdapter: WalletBindingPort = DB_BACKED
  ? drizzleWalletBindingAdapter
  : memoryWalletBindingAdapter;
