"use client";

// ============================================================
// components/access-manager/AccessManagerActions.tsx
//
// Drop-in write actions panel for AccessManagerPanel.
// Uses ContractFunctionUI — zero boilerplate per function.
//
// Renders: grantRole, revokeRole, renounceRole, labelRole,
//          setTargetFunctionRole, setGrantDelay
//
// Add this as a tab inside AccessManagerPanel.
// ============================================================

import type { AccessManagerConfig } from "@/types/access-manager";
import type { Address } from "@/lib/core/types";
import { ContractFunctionUI, type FunctionMeta } from "@/components/contract-ui/ContractFunctionUI";
import { PLATFORM_ACCESS_MANAGER_ABI } from "@/lib/generated/platform-access-manager/abi";
import { TOKEN_ACCESS_MANAGER_ABI } from "@/lib/generated/token-access-manager/abi";

interface AccessManagerActionsProps {
  config: AccessManagerConfig;
  connectedAddress: Address | null;
  onSuccess?: () => void; // call this to refetch member list after a change
}

// Human-readable metadata for each function
const AM_FUNCTION_META: FunctionMeta = {
  grantRole: {
    label: "Grant Role",
    description: "Grant a role to an account. Set executionDelay > 0 to require a timelock before the role takes effect.",
  },
  revokeRole: {
    label: "Revoke Role",
    description: "Revoke a role from an account. The account immediately loses access.",
  },
  renounceRole: {
    label: "Renounce Role",
    description: "Renounce your own role. You must confirm your own address as callerConfirmation.",
  },
  labelRole: {
    label: "Label Role",
    description: "Set a human-readable label for a role ID. Emits RoleLabel event.",
  },
  setGrantDelay: {
    label: "Set Grant Delay",
    description: "Set the minimum delay before a newly granted role takes effect.",
  },
  setTargetFunctionRole: {
    label: "Set Function Role",
    description: "Assign a role requirement to one or more function selectors on a target contract.",
  },
  setTargetClosed: {
    label: "Close Target",
    description: "Lock or unlock all functions on a target contract.",
  },
  setTargetAdminDelay: {
    label: "Set Admin Delay",
    description: "Set the admin delay for a target contract.",
  },
  // Hide low-level functions from the UI
  execute: { hidden: true },
  cancel: { hidden: true },
  schedule: { hidden: true },
  consumeScheduledOp: { hidden: true },
  multicall: { hidden: true },
  updateAuthority: { hidden: true },
  initialize: { hidden: true },
};

// Functions to show in the UI — in this order
const VISIBLE_FUNCTIONS = [
  "grantRole",
  "revokeRole",
  "renounceRole",
  "labelRole",
  "setGrantDelay",
  "setTargetFunctionRole",
  "setTargetClosed",
  "setTargetAdminDelay",
];

export function AccessManagerActions({
  config,
  connectedAddress,
  onSuccess,
}: AccessManagerActionsProps) {
  if (!connectedAddress) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Connect your wallet to perform write actions.
      </p>
    );
  }

  if (!config.contractAddress) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Contract address is not configured for this chain. Set env vars in .env.local.
      </p>
    );
  }

  const abi = config.scope === "token" ? TOKEN_ACCESS_MANAGER_ABI : PLATFORM_ACCESS_MANAGER_ABI;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-4">
        All transactions go through server-side simulation before signing.
        Sensitive operations require confirmation.
      </p>

      <ContractFunctionUI
        contractAddress={config.contractAddress as Address}
        abi={abi as readonly unknown[]}
        chainId={config.chainId}
        roles={config.roles}
        only={VISIBLE_FUNCTIONS}
        meta={AM_FUNCTION_META}
        layout="accordion"
        onSuccess={(_fnName, _hash) => onSuccess?.()}
        onError={(fnName, err) => {
          console.error(`[AccessManagerActions] ${fnName} failed:`, err.message);
        }}
      />
    </div>
  );
}
