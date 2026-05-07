// ============================================================
// lib/core/errors.ts
// Typed domain errors — thrown by services, caught by hooks/UI.
// Never expose raw library errors (wagmi, viem, alchemy) to UI.
// Always wrap in a DomainError with a meaningful code.
// ============================================================

import { DomainError, type DomainErrorCode } from "./types";

// ─── Factory helpers ─────────────────────────────────────────
export function walletNotConnected(): DomainError {
  return new DomainError(
    "WALLET_NOT_CONNECTED",
    "No wallet connected. Please connect your wallet to continue.",
  );
}

export function wrongChain(expected: number, actual: number): DomainError {
  return new DomainError(
    "WALLET_WRONG_CHAIN",
    `Wrong network. Expected chain ${expected}, connected to ${actual}. Please switch networks.`,
  );
}

export function transactionRejected(): DomainError {
  return new DomainError(
    "TRANSACTION_REJECTED",
    "Transaction was rejected in your wallet.",
  );
}

export function transactionReverted(reason?: string): DomainError {
  return new DomainError(
    "TRANSACTION_REVERTED",
    reason
      ? `Transaction reverted: ${reason}`
      : "Transaction reverted on-chain. Check that all conditions are met.",
  );
}

export function complianceCheckFailed(rule: string, reason?: string): DomainError {
  return new DomainError(
    "COMPLIANCE_CHECK_FAILED",
    reason
      ? `Compliance check failed (${rule}): ${reason}`
      : `Compliance check failed: ${rule}`,
  );
}

export function insufficientRole(required: string): DomainError {
  return new DomainError(
    "INSUFFICIENT_ROLE",
    `This action requires the ${required} role. Your wallet does not hold it.`,
  );
}

export function gasPolicyExhausted(tier: string): DomainError {
  return new DomainError(
    "GAS_POLICY_EXHAUSTED",
    `Gas sponsorship limit reached for ${tier} tier. Please upgrade or pay gas directly.`,
  );
}

export function multisigRejected(): DomainError {
  return new DomainError(
    "MULTISIG_REJECTED",
    "Multisig approval was rejected or threshold not reached.",
  );
}

export function providerNotInitialized(adapter: string): DomainError {
  return new DomainError(
    "PROVIDER_NOT_INITIALIZED",
    `${adapter} adapter is not initialized. Check your configuration.`,
  );
}

export function adapterNotImplemented(method: string): DomainError {
  return new DomainError(
    "ADAPTER_NOT_IMPLEMENTED",
    `${method} is not implemented in the current wallet adapter. This feature requires a different configuration.`,
  );
}

export function contractCallFailed(fn: string, reason?: string): DomainError {
  return new DomainError(
    "CONTRACT_CALL_FAILED",
    reason
      ? `Contract call to ${fn} failed: ${reason}`
      : `Contract call to ${fn} failed.`,
  );
}

// ─── Identity / org / invite errors ──────────────────────────
export function unauthenticated(): DomainError {
  return new DomainError("UNAUTHENTICATED", "Sign in required to continue.");
}

export function forbidden(reason?: string): DomainError {
  return new DomainError(
    "FORBIDDEN",
    reason ? `Forbidden: ${reason}` : "You do not have permission for this action.",
  );
}

export function orgNotFound(orgId: string): DomainError {
  return new DomainError("ORG_NOT_FOUND", `Organization ${orgId} was not found.`);
}

export function membershipNotFound(): DomainError {
  return new DomainError(
    "MEMBERSHIP_NOT_FOUND",
    "You are not a member of this organization.",
  );
}

export function inviteNotFound(inviteId: string): DomainError {
  return new DomainError("INVITE_NOT_FOUND", `Invite ${inviteId} was not found.`);
}

export function inviteAlreadyExists(email: string): DomainError {
  return new DomainError(
    "INVITE_ALREADY_EXISTS",
    `An invite for ${email} already exists.`,
  );
}

export function walletLinkInvalid(reason?: string): DomainError {
  return new DomainError(
    "WALLET_LINK_INVALID",
    reason
      ? `Wallet link verification failed: ${reason}`
      : "Wallet link verification failed.",
  );
}

export function webhookSignatureInvalid(): DomainError {
  return new DomainError(
    "WEBHOOK_SIGNATURE_INVALID",
    "Webhook signature verification failed.",
  );
}

// ─── Error normalization ─────────────────────────────────────
// Converts raw errors from wagmi/viem/alchemy into DomainErrors.
// Call this in every adapter's catch block.
export function normalizeToDomainError(error: unknown): DomainError {
  if (error instanceof DomainError) return error;

  const message = error instanceof Error ? error.message : String(error);

  // User rejected in wallet
  if (
    message.includes("User rejected") ||
    message.includes("user rejected") ||
    message.includes("ACTION_REJECTED") ||
    message.includes("4001")
  ) {
    return transactionRejected();
  }

  // Revert reasons
  if (message.includes("reverted") || message.includes("UNPREDICTABLE_GAS_LIMIT")) {
    const reason = extractRevertReason(message);
    return transactionReverted(reason);
  }

  // Compliance revert patterns from your contracts
  if (
    message.includes("ComplianceCheck") ||
    message.includes("TransferRestricted") ||
    message.includes("AccountFrozen")
  ) {
    return complianceCheckFailed("on-chain", message);
  }

  // Access control revert
  if (
    message.includes("AccessManagerUnauthorized") ||
    message.includes("AccessControlUnauthorized")
  ) {
    return insufficientRole("required");
  }

  return new DomainError("UNKNOWN", message, error);
}

function extractRevertReason(message: string): string | undefined {
  // Try to extract reason from common revert message formats
  const match =
    message.match(/reason="([^"]+)"/) ??
    message.match(/reverted with reason string '([^']+)'/) ??
    message.match(/execution reverted: (.+)/);
  return match?.[1];
}
