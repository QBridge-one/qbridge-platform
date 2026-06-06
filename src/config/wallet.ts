// ============================================================
// config/wallet.ts
//
// Whether the active wallet provider is configured. Privy is the sole
// provider; this stays a small indirection so UI gates (WalletStatus)
// don't import a vendor config directly, and so adding a future provider
// (Alchemy / Turnkey) is a one-line change here.
// ============================================================

import { isPrivyConfigured } from "./privy";

export const isActiveWalletConfigured = isPrivyConfigured;
