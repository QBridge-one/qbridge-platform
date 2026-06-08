// ============================================================
// lib/contracts/manageable-targets.ts
//
// Catalog of platform-singleton contracts and their state-changing
// functions, with selectors derived from the ABIs (no hand-typed hex).
// Used by the ops "Platform Permissions" page to wire each function to a
// PlatformAccessManager role via setTargetFunctionRole.
//
// Keys match registry.ts / useContracts contractAddressKeys so the page
// resolves addresses per-chain.
// ============================================================

import { toFunctionSelector, type AbiFunction } from "viem";
import type { Hex } from "@/lib/core/types";
import { FACTORY_ABI } from "@/lib/generated/factory";
import { CREATE_DEAL_ABI } from "@/lib/contracts/create-deal-abi";
import { ISSUER_REGISTRY_ABI } from "@/lib/generated/issuer-registry";
import { TOKEN_REGISTRY_ABI } from "@/lib/generated/token-registry";

export interface ManageableFn {
  name: string;
  selector: Hex;
}

export interface ManageableTarget {
  /** contractAddressKey in registry.ts (factory, issuerRegistry, …). */
  key: string;
  label: string;
  functions: ManageableFn[];
}

/** State-changing functions of an ABI, de-duped by name, with selectors. */
function writeFns(abi: readonly unknown[]): ManageableFn[] {
  const out: ManageableFn[] = [];
  const seen = new Set<string>();
  for (const item of abi as AbiFunction[]) {
    if (!item || item.type !== "function") continue;
    if (item.stateMutability === "view" || item.stateMutability === "pure") continue;
    if (seen.has(item.name)) continue;
    seen.add(item.name);
    out.push({ name: item.name, selector: toFunctionSelector(item) });
  }
  return out;
}

// createDeal is excluded from the generated FACTORY_ABI (see
// create-deal-abi.ts), so merge it back in for the factory target.
const factoryFns = writeFns([...CREATE_DEAL_ABI, ...FACTORY_ABI]);

export const MANAGEABLE_TARGETS: ManageableTarget[] = [
  { key: "factory", label: "Factory", functions: factoryFns },
  { key: "issuerRegistry", label: "Issuer Registry", functions: writeFns(ISSUER_REGISTRY_ABI) },
  { key: "tokenRegistry", label: "Token Registry", functions: writeFns(TOKEN_REGISTRY_ABI) },
];
