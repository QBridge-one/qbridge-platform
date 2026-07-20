"use client";

import Link from "next/link";
import { T, sectionBase, containerStyle, labelStyle, h2Style, dividerStyle, GridTexture, FadeIn } from "./shared";
import { MARKETING_PRODUCTS } from "@/lib/marketing/products";

export function ProductsGrid() {
  return (
    <section style={{ ...sectionBase, background: T.navyMid }}>
      <GridTexture />
      <div style={containerStyle}>
        <FadeIn style={{ marginBottom: 64 }}>
          <span style={labelStyle}>Products</span>
          <h2 style={{ ...h2Style, marginTop: 12 }}>
            One platform, a product for every asset class.
          </h2>
          <div style={dividerStyle} />
          <p style={{ fontSize: 16, lineHeight: 1.75, color: T.muted, maxWidth: 640 }}>
            Each asset class is a focused product on shared QBridge infrastructure —
            one identity, wallet, and compliance layer beneath them all.
          </p>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {MARKETING_PRODUCTS.map((p, i) => {
            const live = p.status === "live";
            return (
              <FadeIn key={p.slug} delay={i * 70} style={{ height: "100%" }}>
                <Link
                  href={`/products/${p.slug}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    textDecoration: "none",
                    background: T.navy,
                    border: `1px solid ${T.border}`,
                    padding: "34px 28px",
                    transition: "border-color 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.goldDim; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <span style={{
                      ...labelStyle, fontSize: 10,
                      border: `1px solid ${T.navyBdr}`,
                      padding: "3px 10px",
                      color: T.muted,
                    }}>
                      {p.tag}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: T.coldW, marginBottom: 12, fontFamily: "'Playfair Display', serif" }}>
                    {p.name}
                  </h3>
                  <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.75, flex: 1 }}>{p.tagline}</p>
                  <span style={{ marginTop: 20, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: T.accent, fontFamily: "'DM Mono', monospace" }}>
                    {live ? "Explore →" : "Learn more →"}
                  </span>
                </Link>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
