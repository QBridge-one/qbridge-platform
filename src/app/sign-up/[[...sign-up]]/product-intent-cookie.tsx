"use client";

import { useEffect } from "react";

// Stashes the marketing entry product (from /sign-up?product=…) in a short-
// lived cookie. Read server-side at KYB submit to seed the issuer org's
// product entitlement, so a stablecoin signup gets a stablecoin-only workspace.
export function ProductIntentCookie({ product }: { product: string }) {
  useEffect(() => {
    document.cookie = `qb_product=${encodeURIComponent(product)}; path=/; max-age=1800; samesite=lax`;
  }, [product]);
  return null;
}
