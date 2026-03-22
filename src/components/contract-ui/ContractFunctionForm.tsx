"use client";

// ============================================================
// components/contract-ui/ContractFunctionForm.tsx
//
// Renders a complete validated form for any ABI write function.
// Inputs are auto-generated from the ABI descriptor.
// On submit: runs through TransactionService (prepare → sign → broadcast).
//
// Usage:
//   <ContractFunctionForm
//     fn={parsedAbi.writes.find(f => f.name === "grantRole")}
//     contractAddress={platformAMAddress}
//     abi={PlatformABI}
//     chainId={11155111}
//     roles={config.roles}
//     onSuccess={(hash) => refetch()}
//   />
// ============================================================

import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AbiFunctionDescriptor } from "@/lib/abi-engine/parser";
import { buildFormSchema, convertFormValues } from "@/lib/abi-engine/form-schema";
import { transactionService } from "@/lib/container";
import type { RoleDefinition } from "@/types/access-manager";
import type { Address } from "@/lib/core/types";
import { ParamInput } from "./ParamInput";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ContractFunctionFormProps {
  fn: AbiFunctionDescriptor;
  contractAddress: Address;
  abi: readonly unknown[];
  chainId: number;
  roles?: RoleDefinition[];          // for role_id param widgets
  description?: string;              // human description shown above form
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

type FormState = "idle" | "submitting" | "success" | "error";

export function ContractFunctionForm({
  fn,
  contractAddress,
  abi,
  chainId,
  roles,
  description,
  onSuccess,
  onError,
}: ContractFunctionFormProps) {
  const [state, setState] = useState<FormState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const schema = buildFormSchema(fn, roles);
  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(
      fn.inputs.map((p) => [p.name, p.semantic === "bool" ? false : ""]),
    ),
  });

  async function handleSubmit(values: Record<string, unknown>) {
    setState("submitting");
    setErrorMsg(null);
    setTxHash(null);

    try {
      const args = convertFormValues(values, fn);

      const result = await transactionService.execute({
        contractCall: {
          address: contractAddress,
          abi,
          functionName: fn.name,
          args,
          chainId,
        },
        description: description ?? fn.label,
        callbacks: {
          onSubmit: (hash) => setTxHash(hash),
        },
      });

      if (result.requiresMultisig && result.safeTxHash) {
        setState("success");
        setTxHash(result.safeTxHash);
        onSuccess?.(result.safeTxHash);
        form.reset();
        return;
      }

      if (result.status === "confirmed" && result.hash) {
        setState("success");
        setTxHash(result.hash);
        onSuccess?.(result.hash);
        form.reset();
      } else if (result.status === "failed") {
        throw result.error ?? new Error("Transaction failed");
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState("error");
      setErrorMsg(error.message);
      onError?.(error);
    }
  }

  const isLoading = state === "submitting";

  // Sensitive functions get a confirmation dialog before submitting
  if (fn.isSensitive) {
    return (
      <FormWrapper fn={fn} description={description}>
        <Form {...form}>
          <form className="space-y-4">
            {fn.inputs.map((param) => (
              <ParamInput
                key={param.name}
                param={param}
                form={form}
                roles={roles}
                disabled={isLoading}
              />
            ))}

            <StatusDisplay
              state={state}
              txHash={txHash}
              errorMsg={errorMsg}
              chainId={chainId}
            />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {fn.label}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm {fn.label}</AlertDialogTitle>
                  <AlertDialogDescription>
                    This is a sensitive operation and cannot be undone.
                    Make sure the values are correct before confirming.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      void form.handleSubmit(async (vals) => {
                        const ok = await form.trigger();
                        if (ok) await handleSubmit(vals);
                      })();
                    }}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Confirm {fn.label}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </form>
        </Form>
      </FormWrapper>
    );
  }

  return (
    <FormWrapper fn={fn} description={description}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {fn.inputs.map((param) => (
            <ParamInput
              key={param.name}
              param={param}
              form={form}
              roles={roles}
              disabled={isLoading}
            />
          ))}

          <StatusDisplay
            state={state}
            txHash={txHash}
            errorMsg={errorMsg}
            chainId={chainId}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Submitting..." : fn.label}
          </Button>
        </form>
      </Form>
    </FormWrapper>
  );
}

// ─── Sub-components ───────────────────────────────────────────
function FormWrapper({
  fn,
  description,
  children,
}: {
  fn: AbiFunctionDescriptor;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-semibold">{fn.label}</h4>
        {fn.isSensitive && (
          <Badge variant="destructive" className="text-xs">Sensitive</Badge>
        )}
        <span className="text-xs text-muted-foreground font-mono ml-auto">
          {fn.signature}
        </span>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}

function StatusDisplay({
  state, txHash, errorMsg, chainId,
}: {
  state: FormState;
  txHash: string | null;
  errorMsg: string | null;
  chainId: number;
}) {
  if (state === "success" && txHash) {
    const explorerUrl = getExplorerUrl(chainId, txHash);
    return (
      <Alert className="border-green-500/50 bg-green-500/10">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertDescription className="text-green-700 dark:text-green-400">
          Transaction confirmed.{" "}
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-mono text-xs"
            >
              {txHash.slice(0, 10)}...
            </a>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (state === "error" && errorMsg) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs break-all">{errorMsg}</AlertDescription>
      </Alert>
    );
  }

  return null;
}

function getExplorerUrl(chainId: number, hash: string): string | null {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io/tx",
    11155111: "https://sepolia.etherscan.io/tx",
    137: "https://polygonscan.com/tx",
  };
  const base = explorers[chainId];
  return base ? `${base}/${hash}` : null;
}
