// ============================================================
// components/providers/wallet-providers.tsx
//
// Single mount point for the wallet provider tree, kept so app/layout.tsx
// stays provider-agnostic. Privy is the sole provider today; a future
// Alchemy / Turnkey tree would branch here on NEXT_PUBLIC_WALLET_PROVIDER.
// ============================================================

import { PrivyProviders } from "@/components/providers/privy-providers";

export function WalletProviders({ children }: { children: React.ReactNode }) {
  return <PrivyProviders>{children}</PrivyProviders>;
}
