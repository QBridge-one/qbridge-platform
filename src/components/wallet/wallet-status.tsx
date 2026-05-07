"use client";

// ============================================================
// components/wallet/wallet-status.tsx
//
// Dashboard-only wallet UI. Renders inside /workspace and /ops
// headers. Drives connect / link / disconnect via the abstract
// hooks (useWallet, useWalletLink) — never imports Web3Auth or
// any other vendor SDK directly. When the wallet provider is
// swapped to Alchemy or Turnkey, this file does NOT change; only
// useWallet's internal implementation does.
//
// States:
//   - placeholder    — wallet provider env not configured
//   - disconnected   — show "Connect wallet"
//   - connecting     — show spinner / disabled button
//   - connected      — show shortAddress + actions (Link, Disconnect)
//   - linked         — additionally show "Linked" + Unlink option
// ============================================================

import { useTransition } from "react";
import { Wallet, LogOut, Link2, Link2Off, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/lib/hooks/useWallet";
import { useWalletLink } from "@/lib/hooks/useWalletLink";
import { isWeb3AuthConfigured } from "@/config/web3auth";
import type { Address } from "@/lib/core/types";

export interface WalletStatusProps {
  /** Address linked to the current Clerk user via SIWE proof, if any. */
  linkedAddress?: Address | null;
}

export function WalletStatus({ linkedAddress = null }: WalletStatusProps) {
  if (!isWeb3AuthConfigured) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        title="Set NEXT_PUBLIC_WEB3AUTH_CLIENT_ID (or swap WALLET_PROVIDER) and restart"
      >
        <Wallet className="mr-2 h-4 w-4" />
        Wallet not configured
      </Button>
    );
  }

  return <WalletStatusInner linkedAddress={linkedAddress} />;
}

function WalletStatusInner({ linkedAddress }: { linkedAddress: Address | null }) {
  const {
    isConnected,
    isConnecting,
    address,
    shortAddress,
    connect,
    disconnect,
  } = useWallet();
  const { link, unlink, isLinking } = useWalletLink();
  const [, startTransition] = useTransition();

  if (!isConnected || !address) {
    return (
      <Button
        variant="default"
        size="sm"
        onClick={() => connect()}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="mr-2 h-4 w-4" />
        )}
        {isConnecting ? "Connecting…" : "Connect wallet"}
      </Button>
    );
  }

  const isLinked =
    !!linkedAddress && linkedAddress.toLowerCase() === address.toLowerCase();

  const handleLink = async () => {
    const r = await link();
    if (r.ok) {
      toast.success("Wallet linked to your account.");
      startTransition(() => {
        // Trigger server component refresh so layouts re-read primaryWallet
        if (typeof window !== "undefined") window.location.reload();
      });
    } else {
      toast.error("Could not link wallet. Try again.");
    }
  };

  const handleUnlink = async () => {
    const r = await unlink();
    if (r.ok) {
      toast.success("Wallet unlinked.");
      startTransition(() => {
        if (typeof window !== "undefined") window.location.reload();
      });
    } else {
      toast.error("Could not unlink wallet.");
    }
  };

  const initials = address.slice(2, 4).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-mono outline-none ring-offset-background hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Wallet menu"
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
              isLinked
                ? "bg-emerald-500/15 text-emerald-600"
                : "bg-amber-500/15 text-amber-600"
            }`}
          >
            {isLinked ? <Check className="h-3 w-3" /> : initials}
          </span>
          {shortAddress}
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
              <p className="text-xs text-amber-600 mt-1">
                Not yet linked to your account
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!isLinked ? (
          <DropdownMenuItem
            disabled={isLinking}
            onClick={() => void handleLink()}
            className="cursor-pointer"
          >
            {isLinking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            {isLinking ? "Signing…" : "Link to account"}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            disabled={isLinking}
            onClick={() => void handleUnlink()}
            className="cursor-pointer"
          >
            <Link2Off className="mr-2 h-4 w-4" />
            Unlink
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => disconnect()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
