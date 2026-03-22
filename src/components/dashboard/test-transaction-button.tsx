"use client";

// ============================================================
// TEMPORARY: Test button for TransactionService + Web3Auth.
// Remove when done testing server-side prepare/broadcast flow.
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useWallet } from "@/lib/hooks/useWallet";
import { useContracts } from "@/lib/hooks/useContracts";
import { transactionService } from "@/lib/container";
import type { Address } from "@/lib/core/types";

// ERC20 approve — permissionless, no-op when approving 0 to self
const ERC20_APPROVE_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

// Circle USDC on Sepolia — standard ERC20, approve(self, 0) always succeeds
const USDC_SEPOLIA = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as Address;

export function TestTransactionButton() {
  const { isConnected, address } = useWallet();
  const { chainId } = useContracts();
  const [status, setStatus] = useState<string>("idle");
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!address || !chainId) {
      setError("Wallet not connected");
      return;
    }

    if (chainId !== 11155111) {
      setError("Switch to Sepolia to run test");
      return;
    }

    setStatus("preparing");
    setError(null);
    setHash(null);

    try {
      const result = await transactionService.execute({
        contractCall: {
          address: USDC_SEPOLIA,
          abi: ERC20_APPROVE_ABI as readonly unknown[],
          functionName: "approve",
          args: [address, BigInt(0)],
          chainId,
        },
        description: "Test TX (ERC20 approve 0 to self — no-op)",
        skipComplianceCheck: true,
        callbacks: {
          onSubmit: (h) => {
            setHash(h);
            setStatus("pending");
          },
          onConfirm: () => setStatus("confirmed"),
          onError: (err) => {
            setError(err.message);
            setStatus("failed");
          },
        },
      });

      if (result.status === "failed") {
        setError(result.error?.message ?? "Transaction failed");
        setStatus("failed");
        return;
      }
      if (result.hash) setHash(result.hash);
      setStatus(result.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("failed");
    }
  };

  if (!isConnected) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
        <CardHeader className="py-3">
          <span className="text-sm font-medium">Test transaction</span>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Connect your Web3Auth wallet first.
          </p>
        </CardContent>
      </Card>
    );
  }

  const canRun = chainId === 11155111;

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
      <CardHeader className="py-3">
        <span className="text-sm font-medium">Test transaction (temp)</span>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Calls USDC.approve(self, 0) on Sepolia — harmless no-op, no permissions needed.
        </p>
        {!canRun && (
          <p className="text-xs text-muted-foreground">
            Switch to Sepolia chain
          </p>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={handleTest}
          disabled={!canRun || status === "preparing" || status === "pending"}
        >
          {status === "preparing" && "Preparing…"}
          {status === "pending" && "Confirming…"}
          {status === "confirmed" && "Done"}
          {status === "failed" && "Retry"}
          {status === "idle" && "Run test TX"}
        </Button>
        {hash && (
          <p className="text-xs font-mono truncate">
            Hash: {hash}
          </p>
        )}
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
