"use client";

// ============================================================
// components/wallet/wallet-status.tsx
//
// Dashboard-only wallet UI (in /workspace and /ops headers). Reads the
// abstract useWallet() hook — never a vendor SDK directly.
//
// The Privy embedded wallet auto-provisions on Clerk login and is bound
// to the user automatically by <PrivyAutoBind> (verified identity token,
// no SIWE). So this is purely a status display: a brief "Loading wallet…"
// then the address, with a "Linked" indicator once the binding lands.
// ============================================================

import { Wallet, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/lib/hooks/useWallet";
import { isActiveWalletConfigured } from "@/config/wallet";
import type { Address } from "@/lib/core/types";

export interface WalletStatusProps {
  /** The user's primary wallet (from the Postgres binding), if any. */
  linkedAddress?: Address | null;
}

export function WalletStatus({ linkedAddress = null }: WalletStatusProps) {
  if (!isActiveWalletConfigured) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        title="Set NEXT_PUBLIC_PRIVY_APP_ID and restart"
      >
        <Wallet className="mr-2 h-4 w-4" />
        Wallet not configured
      </Button>
    );
  }

  return <WalletStatusInner linkedAddress={linkedAddress} />;
}

function WalletStatusInner({ linkedAddress }: { linkedAddress: Address | null }) {
  const { isConnected, address, shortAddress } = useWallet();

  const isLinked =
    !!linkedAddress &&
    !!address &&
    linkedAddress.toLowerCase() === address.toLowerCase();

  // Embedded wallet auto-provisions on login — brief loading until it attaches.
  if (!isConnected || !address) {
    return (
      <div
        className="flex h-8 items-center gap-2 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground sm:h-9 sm:px-3"
        aria-label="Loading wallet"
      >
        <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
        <span className="hidden sm:inline">Loading wallet…</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-8 items-center gap-2 rounded-md border border-input bg-background px-2 text-xs font-mono outline-none ring-offset-background hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-9 sm:px-3"
          aria-label="Wallet menu"
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              isLinked
                ? "bg-emerald-500/15 text-emerald-600"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isLinked ? <Check className="h-3 w-3" /> : <Wallet className="h-3 w-3" />}
          </span>
          <span className="hidden sm:inline">{shortAddress}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Embedded wallet</p>
            <p className="font-mono text-xs break-all">{address}</p>
            {isLinked ? (
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <Check className="h-3 w-3" />
                Linked to your account
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Linking to your account…
              </p>
            )}
          </div>
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
