// ============================================================
// lib/services/transaction.service.ts
//
// Orchestrates: compliance → gas → multisig → server prepare
//               → client sign → server broadcast → confirm
//
// v2 change: Steps 5-6 go through /api/tx/prepare + /api/tx/broadcast.
// Server encodes calldata, simulates, records every attempt.
// Client ONLY signs — never encodes or broadcasts directly.
// ============================================================

import { encodeFunctionData, toFunctionSelector } from "viem";
import type { WalletPort } from "../ports/wallet.port";
import type { BlockchainPort } from "../ports/blockchain.port";
import type { GasPolicyPort, MultisigPort, CompliancePort } from "../ports/index";
import type {
  Hex, TransactionRequest,
  TransactionStatus, TransactionCallbacks, ContractCallParams,
  DomainEvent,
} from "../core/types";
import {
  normalizeToDomainError, walletNotConnected, complianceCheckFailed,
} from "../core/errors";

export interface TransactionServiceConfig {
  walletPort: WalletPort;
  blockchainPort: BlockchainPort;
  gasPolicyPort: GasPolicyPort;
  multisigPort: MultisigPort;
  compliancePort: CompliancePort;
  onEvent?: (event: DomainEvent) => void;
  confirmations?: number;
}

export interface ExecuteParams {
  contractCall: ContractCallParams;
  description?: string;
  issuerId?: string;
  skipComplianceCheck?: boolean;
  callbacks?: TransactionCallbacks;
}

export interface ExecuteResult {
  hash: Hex | null;
  status: TransactionStatus;
  error?: Error;
  safeTxHash?: Hex;
  requiresMultisig?: boolean;
  intentId?: string;
}

export class TransactionService {
  constructor(private readonly config: TransactionServiceConfig) {}

  async execute(params: ExecuteParams): Promise<ExecuteResult> {
    const {
      walletPort, blockchainPort, gasPolicyPort,
      multisigPort, compliancePort, onEvent, confirmations = 1,
    } = this.config;

    try {
      // 1: wallet connected
      if (!walletPort.isReady()) throw walletNotConnected();
      const callerAddress = await walletPort.getAddress();

      // 2: compliance pre-flight
      if (!params.skipComplianceCheck) {
        const result = await compliancePort.preflightCheck({
          callerAddress, contractCall: params.contractCall,
        });
        if (result.status === "failed") {
          throw complianceCheckFailed(result.failedRule ?? "unknown", result.reason);
        }
      }

      // 3: gas policy
      const selector = extractSelector(params.contractCall);
      const gasPolicy = await gasPolicyPort.checkEligibility({
        callerAddress,
        targetAddress: params.contractCall.address,
        selector,
        issuerId: params.issuerId,
      });

      // 4: multisig check
      const needsMultisig = await multisigPort.isRequired({
        callerAddress, targetAddress: params.contractCall.address, selector,
      });

      if (needsMultisig) {
        const safeAddress = walletPort.getSmartAccountConfig()?.safeConfig?.safeAddress;
        if (!safeAddress) throw new Error("Multisig required but no Safe address configured");
        const request = buildTransactionRequest(params.contractCall);
        const safeTxHash = await multisigPort.propose({ safeAddress, request });
        params.callbacks?.onSign?.(safeTxHash);
        onEvent?.({ type: "operation.scheduled", payload: { safeTxHash, callerAddress }, timestamp: Date.now() });
        return { hash: null, safeTxHash, status: "pending", requiresMultisig: true };
      }

      // 5: server prepare
      // Server encodes calldata, simulates, stores intent with TTL.
      // BigInt cannot be JSON-serialized — convert to string for transport.
      const prepareRes = await fetch("/api/tx/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-caller-address": callerAddress },
        body: JSON.stringify({
          address: params.contractCall.address,
          abi: params.contractCall.abi,
          functionName: params.contractCall.functionName,
          args: serializeArgsForJson(params.contractCall.args ?? []),
          chainId: params.contractCall.chainId,
          value:
            params.contractCall.value !== undefined && params.contractCall.value !== BigInt(0)
              ? `0x${params.contractCall.value.toString(16)}`
              : undefined,
        }),
      });

      if (!prepareRes.ok) {
        const { error } = await prepareRes.json().catch(() => ({ error: "Prepare failed" }));
        throw new Error(error ?? "Transaction prepare failed on server");
      }

      const { intentId, unsignedTx } = await prepareRes.json();

      // 6: client signs + sends
      const paymasterData = await gasPolicyPort.buildPaymasterData(
        { to: unsignedTx.to, data: unsignedTx.data },
        gasPolicy,
      );

      const request: TransactionRequest = {
        to: unsignedTx.to,
        data: unsignedTx.data,
        value: parseUnsignedTxValue(unsignedTx.value),
        chainId: unsignedTx.chainId,
        // Every on-chain write is an admin action here → surface a pre-sign
        // confirmation in the wallet. The adapter maps this to its provider's
        // confirmation UI (Privy uiOptions); providers without one ignore it.
        confirmation: {
          description: params.description ?? params.contractCall.functionName,
        },
        ...(paymasterData ? { paymasterData } : {}),
      };

      // TODO: split into signTransaction → POST /api/tx/broadcast
      // when wagmi exposes signTransaction separately.
      const hash = await walletPort.sendTransaction(request);
      params.callbacks?.onSubmit?.(hash);

      onEvent?.({
        type: "transaction.submitted",
        payload: { hash, callerAddress, intentId, ...params.contractCall },
        timestamp: Date.now(),
      });

      // 7: wait for the receipt. waitForTransaction maps a reverted receipt to
      // status "failed" — a tx can be MINED ("included in a block") yet revert
      // (e.g. on-chain AccessManager rejects the caller), so we must NOT report
      // that as success. Surface it as an error instead.
      const receipt = await blockchainPort.waitForTransaction(hash, confirmations);

      if (receipt.status === "failed") {
        const revertError = normalizeToDomainError(
          new Error("Transaction was included in a block but reverted on-chain."),
        );
        params.callbacks?.onError?.(revertError);
        onEvent?.({
          type: "transaction.failed",
          payload: { error: revertError },
          timestamp: Date.now(),
        });
        return { hash, status: "failed", error: revertError, intentId };
      }

      params.callbacks?.onConfirm?.(receipt);

      onEvent?.({
        type: "transaction.confirmed",
        payload: { hash, receipt, callerAddress, intentId },
        timestamp: Date.now(),
      });

      return { hash, status: "confirmed", intentId };

    } catch (err) {
      const domainError = normalizeToDomainError(err);
      params.callbacks?.onError?.(domainError);
      onEvent?.({ type: "transaction.failed", payload: { error: domainError }, timestamp: Date.now() });
      return { hash: null, status: "failed", error: domainError };
    }
  }
}

function buildTransactionRequest(call: ContractCallParams): TransactionRequest {
  const data = encodeFunctionData({
    abi: call.abi as any,
    functionName: call.functionName,
    args: call.args as any,
  });
  return { to: call.address, data: data as Hex, value: call.value, chainId: call.chainId };
}

function serializeArgsForJson(args: readonly unknown[]): unknown[] {
  return args.map((arg) =>
    typeof arg === "bigint" ? arg.toString() : arg
  );
}

function parseUnsignedTxValue(v: unknown): bigint | undefined {
  if (v == null || v === "" || v === "0" || v === "0x0") return undefined;
  if (typeof v === "string") return BigInt(v);
  return undefined;
}

function extractSelector(call: ContractCallParams): Hex {
  try {
    const abiItem = (call.abi as any[]).find(
      (item) => item.type === "function" && item.name === call.functionName,
    );
    if (!abiItem) return "0x00000000" as Hex;
    return toFunctionSelector(abiItem) as Hex;
  } catch {
    return "0x00000000" as Hex;
  }
}
