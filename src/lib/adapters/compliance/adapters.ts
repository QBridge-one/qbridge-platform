// ============================================================
// lib/adapters/multisig/no-multisig.adapter.ts
// Default multisig adapter — multisig never required.
// Active for all roles until Safe is explicitly enabled per policy.
// ============================================================

import type { MultisigPort, CompliancePort } from "../../ports/index";
import type {
  Address, Bytes32, Hex, MultisigApproval, TransactionRequest,
  ComplianceCheckResult, ContractCallParams,
} from "../../core/types";

export class NoMultisigAdapter implements MultisigPort {
  async isRequired(_params: {
    callerAddress: Address;
    targetAddress: Address;
    selector: Hex;
  }): Promise<boolean> {
    return false; // Never required until Safe is configured
  }

  async propose(_params: {
    safeAddress: Address;
    request: TransactionRequest;
  }): Promise<Bytes32> {
    throw new Error("NoMultisigAdapter: multisig not enabled for this role");
  }

  async getApprovalStatus(_safeTxHash: Bytes32): Promise<MultisigApproval> {
    throw new Error("NoMultisigAdapter: multisig not enabled");
  }

  async sign(_safeTxHash: Bytes32): Promise<void> {
    throw new Error("NoMultisigAdapter: multisig not enabled");
  }

  async execute(_safeTxHash: Bytes32): Promise<Hex> {
    throw new Error("NoMultisigAdapter: multisig not enabled");
  }
}

export const noMultisigAdapter = new NoMultisigAdapter();

// ============================================================
// lib/adapters/multisig/safe.adapter.ts
// STUB — Safe{Core} multisig adapter.
// ============================================================

export class SafeAdapter implements MultisigPort {
  constructor(
    private readonly config: {
      rpcUrl: string;
      safeAddress?: Address;
    }
  ) {}

  async isRequired(_params: {
    callerAddress: Address;
    targetAddress: Address;
    selector: Hex;
  }): Promise<boolean> {
    // TODO: check role policy — is Safe required for this function?
    // Could be config-driven: ENFORCER + forceTransfer → always multisig
    throw new Error("SafeAdapter: not yet implemented");
  }

  async propose(_params: { safeAddress: Address; request: TransactionRequest }): Promise<Bytes32> {
    // TODO: Safe SDK proposeTransaction
    throw new Error("SafeAdapter: not yet implemented");
  }

  async getApprovalStatus(_safeTxHash: Bytes32): Promise<MultisigApproval> {
    // TODO: Safe SDK getTransaction + getOwnersWhoApprovedTx
    throw new Error("SafeAdapter: not yet implemented");
  }

  async sign(_safeTxHash: Bytes32): Promise<void> {
    // TODO: Safe SDK approveTransactionHash
    throw new Error("SafeAdapter: not yet implemented");
  }

  async execute(_safeTxHash: Bytes32): Promise<Hex> {
    // TODO: Safe SDK executeTransaction
    throw new Error("SafeAdapter: not yet implemented");
  }
}

// ============================================================
// lib/adapters/compliance/on-chain.adapter.ts
// On-chain compliance pre-flight — simulates the tx before submitting.
// Catches compliance reverts before wasting gas.
// ============================================================

import { getPublicClient } from "@wagmi/core";
import { wagmiConfig } from "@/lib/wagmi-config";

export class OnChainComplianceAdapter implements CompliancePort {
  async preflightCheck(params: {
    callerAddress: Address;
    contractCall: ContractCallParams;
  }): Promise<ComplianceCheckResult> {
    try {
      const client = getPublicClient(wagmiConfig, params.contractCall.chainId
        ? { chainId: params.contractCall.chainId as 1 | 11155111 | 137 }
        : undefined,
      );
      if (!client) return { status: "skipped" };

      await client.simulateContract({
        address: params.contractCall.address,
        abi: params.contractCall.abi as any,
        functionName: params.contractCall.functionName,
        args: params.contractCall.args as any,
        account: params.callerAddress,
        value: params.contractCall.value,
      });

      return { status: "passed" };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // Map known compliance revert reasons to structured results
      if (message.includes("AccountFrozen")) {
        return { status: "failed", failedRule: "AccountFrozen", reason: "Account is frozen" };
      }
      if (message.includes("TransferRestricted")) {
        return { status: "failed", failedRule: "TransferRestricted", reason: "Transfer is restricted" };
      }
      if (message.includes("HoldPeriod")) {
        return { status: "failed", failedRule: "HoldPeriod", reason: "Hold period not elapsed" };
      }
      if (message.includes("InvestorNotEligible")) {
        return { status: "failed", failedRule: "InvestorEligibility", reason: "Investor not eligible" };
      }
      // OpenZeppelin AccessManager — sender lacks authority for grantRole/revokeRole/etc.
      // Selector 0xf07e038f = AccessManagerUnauthorizedAccount(address,uint64) when ABI has no errors.
      if (
        message.includes("AccessManagerUnauthorized") ||
        message.includes("AccessManagerUnauthorizedAccount") ||
        message.includes("0xf07e038f")
      ) {
        return {
          status: "failed",
          failedRule: "AccessControl",
          reason:
            "This wallet is not allowed to perform that action on the Access Manager. For token roles, connect a wallet that holds Token ADMIN (role 0) or the configured admin for that role.",
        };
      }

      // Simulation failed for unknown reason — still a compliance block
      return { status: "failed", failedRule: "SimulationFailed", reason: message };
    }
  }

  async checkKYC(_params: {
    address: Address;
    jurisdiction: string;
    requiredTier: string;
  }): Promise<ComplianceCheckResult> {
    // TODO: call your KYC provider API or on-chain attestation contract (EAS)
    return { status: "skipped" };
  }

  async checkFrozen(params: {
    tokenAddress: Address;
    accountAddress: Address;
  }): Promise<boolean> {
    try {
      const client = getPublicClient(wagmiConfig);
      if (!client) return false;
      // Assumes token contract has frozenBalances(address) → uint256
      const frozen = await client.readContract({
        address: params.tokenAddress,
        abi: [
          {
            name: "frozenBalances",
            type: "function",
            stateMutability: "view",
            inputs: [{ name: "account", type: "address" }],
            outputs: [{ name: "", type: "uint256" }],
          },
        ],
        functionName: "frozenBalances",
        args: [params.accountAddress],
      }) as bigint;
      return frozen > BigInt(0);
    } catch {
      return false;
    }
  }
}

export const onChainComplianceAdapter = new OnChainComplianceAdapter();
