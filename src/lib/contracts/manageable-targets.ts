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
import { REAL_ESTATE_FACTORY_ABI } from "@/lib/generated/real-estate-factory";
import { STABLECOIN_FACTORY_ABI } from "@/lib/generated/stablecoin-factory";
import { CREATE_DEAL_ABI } from "@/lib/contracts/create-deal-abi";
import { CREATE_STABLECOIN_ABI } from "@/lib/contracts/create-stablecoin-abi";
import { ISSUER_REGISTRY_ABI } from "@/lib/generated/issuer-registry";
import { TOKEN_REGISTRY_ABI } from "@/lib/generated/token-registry";
import { getProduct } from "@/lib/products";

export interface ManageableFn {
  name: string;
  selector: Hex;
}

export interface ManageableTarget {
  /** contractAddressKey in registry.ts (realEstateFactory, issuerRegistry, …). */
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

// createDeal is excluded from the generated REAL_ESTATE_FACTORY_ABI (see
// create-deal-abi.ts), so merge it back in for the factory target.
const factoryFns = writeFns([...CREATE_DEAL_ABI, ...REAL_ESTATE_FACTORY_ABI]);

export const MANAGEABLE_TARGETS: ManageableTarget[] = [
  { key: "realEstateFactory", label: "Real Estate Factory", functions: factoryFns },
  // Stablecoin factory is a platform singleton governed by the same
  // PlatformAccessManager — surfaced only when the product is enabled. (The
  // per-stablecoin token/oracle roles live on each instance's own
  // TokenAccessManager, not here.)
  ...(getProduct("stablecoin").enabled
    ? [
        {
          key: "stablecoinFactory",
          label: "Stablecoin Factory",
          // createStablecoin is excluded from the generated ABI (nested tuple),
          // so merge it back in — it's the function that must be opened to
          // issuers (PUBLIC_ROLE), exactly like createDeal on the RE factory.
          functions: writeFns([...CREATE_STABLECOIN_ABI, ...STABLECOIN_FACTORY_ABI]),
        },
      ]
    : []),
  { key: "issuerRegistry", label: "Issuer Registry", functions: writeFns(ISSUER_REGISTRY_ABI) },
  { key: "tokenRegistry", label: "Token Registry", functions: writeFns(TOKEN_REGISTRY_ABI) },
];
