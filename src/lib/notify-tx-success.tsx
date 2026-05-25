"use client";

// ============================================================
// notify-tx-success.tsx
// Sonner toast for confirmed on-chain transactions.
// Uses an <a> action (not window.open) so it works while modals
// are open once AppToaster keeps the toast host interactive.
// ============================================================

import { toast } from "sonner";
import type { Hex } from "@/lib/core/types";
import { explorerTxUrl } from "@/lib/explorer-urls";

const TX_TOAST_ACTION_CLASS =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90";

export function notifyTxSuccess(message: string, chainId: number, hash: Hex) {
  const url = explorerTxUrl(chainId, hash);
  toast.success(message, {
    description: "Transaction confirmed in a block.",
    action: url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={TX_TOAST_ACTION_CLASS}
      >
        View transaction
      </a>
    ) : undefined,
    duration: 12000,
  });
}
