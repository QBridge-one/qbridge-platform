// ============================================================
// lib/products/types.ts
//
// The "product" (asset-class) abstraction. QBridge is one platform that
// issues multiple asset classes through SHARED infrastructure (identity,
// wallet, IssuerRegistry, TokenRegistry, AccessManager, audit) but a
// SEPARATE per-product contract stack + workspace surface.
//
// This mirrors the on-chain split: shared platform singletons + one
// factory/token/compliance cluster per asset class. See:
//   qbridge-smart-contracts/docs/stablecoin-overview.md (§3, §6)
//
// A ProductDefinition is pure metadata/config. It carries NO business
// logic — product-specific logic lives behind services/ports/hooks, keyed
// by the product, exactly like every other adapter in the hexagon.
// ============================================================

import type { Hex } from "@/lib/core/types";

export type ProductKey = "real-estate" | "stablecoin";

export interface ProductDefinition {
  /** Stable identifier used in routes, config and the address registry. */
  key: ProductKey;
  label: string;
  shortLabel: string;
  tagline: string;
  description: string;

  /**
   * Feature flag. A product can ship "dark" (integrated end-to-end but
   * hidden from nav / disabled in the UI) until it is ready to launch.
   */
  enabled: boolean;

  // ─── On-chain discriminator ────────────────────────────────
  // TokenRegistry self-tags every token with (category, assetType), so one
  // tokensByIssuer(X) returns an issuer's tokens across ALL products. We
  // classify a token into its product by matching `categoryHash`.
  /** Human label, e.g. "REAL_ESTATE" / "STABLECOIN". */
  category: string;
  /** keccak256(category) — what is actually stored on TokenRegistry. */
  categoryHash: Hex;

  // ─── Wiring ────────────────────────────────────────────────
  /** Address-registry key for this product's factory (see lib/contracts/registry.ts). */
  factoryAddressKey: "realEstateFactory" | "stablecoinFactory";
  /** Base path for this product's workspace surface. */
  workspaceBasePath: string;
}
