// ============================================================
// lib/products/index.ts — barrel for the product (asset-class) registry.
// ============================================================
export type { ProductDefinition, ProductKey } from "./types";
export {
  PRODUCTS,
  getProduct,
  listProducts,
  listEnabledProducts,
  productByCategoryHash,
  parseProductKeys,
  DEFAULT_ISSUER_PRODUCTS,
} from "./registry";
