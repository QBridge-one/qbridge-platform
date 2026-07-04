"use client";

import { useState } from "react";
import Link from "next/link";
import { T } from "./shared";
import { StatusBadge } from "./products-grid";
import { MARKETING_PRODUCTS } from "@/lib/marketing/products";

// ─── Desktop: hover dropdown ──────────────────────────────────
export function ProductsNavDropdown({ linkStyle }: { linkStyle: React.CSSProperties }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href="/products"
        style={{ ...linkStyle, display: "inline-flex", alignItems: "center", gap: 6, color: open ? T.coldW : T.muted }}
      >
        Products
        <span style={{ fontSize: 9, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
      </Link>

      {/* paddingTop bridges the gap so the panel stays open while moving the cursor onto it */}
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          paddingTop: 14,
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
          transition: "opacity 0.2s ease",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <div
          style={{
            width: 300,
            background: T.navy,
            border: `1px solid ${T.border}`,
            borderRadius: 4,
            padding: 8,
            boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
          }}
        >
          {MARKETING_PRODUCTS.map((p) => (
            <Link
              key={p.slug}
              href={`/products/${p.slug}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "10px 12px",
                textDecoration: "none",
                borderRadius: 3,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.navyMid)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ color: T.coldW, fontSize: 13, fontWeight: 600 }}>{p.tag}</span>
              <StatusBadge live={p.status === "live"} />
            </Link>
          ))}
          <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 6, paddingTop: 6 }}>
            <Link
              href="/products"
              style={{
                display: "block",
                padding: "8px 12px",
                color: T.accent,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.06em",
              }}
            >
              All products →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile: expanded list under a Products heading ───────────
export function ProductsNavMobile({
  onNavigate,
  linkStyle,
}: {
  onNavigate: () => void;
  linkStyle: React.CSSProperties;
}) {
  return (
    <div>
      <Link
        href="/products"
        onClick={onNavigate}
        style={{ ...linkStyle, fontSize: 16, padding: "12px 0", color: T.coldW, display: "block" }}
      >
        Products
      </Link>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          paddingLeft: 12,
          marginTop: 2,
          marginBottom: 8,
          borderLeft: `1px solid ${T.border}`,
        }}
      >
        {MARKETING_PRODUCTS.map((p) => (
          <Link
            key={p.slug}
            href={`/products/${p.slug}`}
            onClick={onNavigate}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", textDecoration: "none", color: T.muted, fontSize: 14 }}
          >
            {p.tag}
            <StatusBadge live={p.status === "live"} />
          </Link>
        ))}
      </div>
    </div>
  );
}
