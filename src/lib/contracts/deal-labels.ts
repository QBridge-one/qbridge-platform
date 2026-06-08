// ============================================================
// lib/contracts/deal-labels.ts
//
// Reverse-decode the bytes32 category/assetType stored on TokenRegistry
// back to human labels (they're keccak256(label) — not reversible in
// general, so we match against the known presets and fall back to a
// short hex).
// ============================================================

import type { Hex } from "@/lib/core/types";
import { toBytes32Label } from "./factory-payload";
import { DEAL_CATEGORY, REAL_ESTATE_ASSET_TYPES } from "@/types/deal";

const CATEGORY_BY_HASH: Record<string, string> = {
  [toBytes32Label(DEAL_CATEGORY).toLowerCase()]: "Real Estate",
};

const ASSET_TYPE_BY_HASH: Record<string, string> = Object.fromEntries(
  REAL_ESTATE_ASSET_TYPES.map((t) => [toBytes32Label(t.value).toLowerCase(), t.label]),
);

export function shortHex(h: string | undefined): string {
  if (!h) return "—";
  return h.length > 12 ? `${h.slice(0, 6)}…${h.slice(-4)}` : h;
}

export function shortAddress(a: string | undefined): string {
  if (!a) return "—";
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

export function decodeCategory(hex: Hex | undefined): string {
  return (hex && CATEGORY_BY_HASH[hex.toLowerCase()]) || shortHex(hex);
}

export function decodeAssetType(hex: Hex | undefined): string {
  return (hex && ASSET_TYPE_BY_HASH[hex.toLowerCase()]) || shortHex(hex);
}
