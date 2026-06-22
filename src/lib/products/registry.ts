// ============================================================
// lib/products/registry.ts
//
// The single source of truth for which asset classes the platform offers.
// This is the app-layer mirror of the per-product factory split on-chain.
//
// HOW TO ADD A NEW PRODUCT (e.g. tokenized treasury):
//   1. Add its contract ABIs under src/contracts/<key>-* and run `yarn generate`.
//   2. Add its factory address key to lib/contracts/registry.ts.
//   3. Add a ProductDefinition entry below.
//   4. Build its workspace surface under the declared workspaceBasePath.
// Shared infra (identity, wallet, IssuerRegistry, TokenRegistry, audit) is
// reused — do NOT fork it per product.
// ============================================================

import { toBytes32Label } from "@/lib/contracts/factory-payload";
import { DEAL_CATEGORY } from "@/types/deal";
import type { ProductDefinition, ProductKey } from "./types";

// Stablecoin ships dark by default — flip NEXT_PUBLIC_PRODUCT_STABLECOIN=true
// to surface it in nav / enable its workspace.
const STABLECOIN_ENABLED =
  (process.env.NEXT_PUBLIC_PRODUCT_STABLECOIN ?? "false").toLowerCase() === "true";

export const PRODUCTS: Record<ProductKey, ProductDefinition> = {
  "real-estate": {
    key: "real-estate",
    label: "Real Estate",
    shortLabel: "Real Estate",
    tagline: "Tokenized real-world property — an SPV cluster per deal.",
    description:
      "Issuers tokenize real-estate SPVs: NAV oracle, distributions, capital calls and " +
      "Reg-D-style compliance (accreditation, hold periods, share classes).",
    enabled: true,
    category: DEAL_CATEGORY, // "REAL_ESTATE"
    categoryHash: toBytes32Label(DEAL_CATEGORY),
    factoryAddressKey: "realEstateFactory",
    workspaceBasePath: "/workspace/assets",
  },
  stablecoin: {
    key: "stablecoin",
    label: "Stablecoin",
    shortLabel: "Stablecoin",
    tagline: "Fiat-backed, proof-of-reserves-gated payment stablecoin.",
    description:
      "A non-custodial payment stablecoin: issuance is gated by an on-chain proof-of-reserves " +
      "oracle, redemption runs a hold→settle→burn queue, and compliance is KYC + sanctions + " +
      "jurisdiction only (no accreditation/classes). Payment instrument, not a security.",
    enabled: STABLECOIN_ENABLED,
    category: "STABLECOIN",
    categoryHash: toBytes32Label("STABLECOIN"),
    factoryAddressKey: "stablecoinFactory",
    workspaceBasePath: "/workspace/stablecoins",
  },
};

// ─── Accessors ─────────────────────────────────────────────────

export function getProduct(key: ProductKey): ProductDefinition {
  return PRODUCTS[key];
}

export function listProducts(): ProductDefinition[] {
  return Object.values(PRODUCTS);
}

/** Products surfaced to users right now (respects the feature flags). */
export function listEnabledProducts(): ProductDefinition[] {
  return listProducts().filter((p) => p.enabled);
}

/**
 * Classify a TokenRegistry token into its product by its on-chain category
 * hash. Returns undefined for categories no product claims (e.g. a future
 * asset class not yet modeled in the app).
 */
export function productByCategoryHash(categoryHash: string | undefined): ProductDefinition | undefined {
  if (!categoryHash) return undefined;
  const target = categoryHash.toLowerCase();
  return listProducts().find((p) => p.categoryHash.toLowerCase() === target);
}
