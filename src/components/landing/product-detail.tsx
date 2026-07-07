"use client";

import Link from "next/link";
import { T, sectionBase, containerStyle, labelStyle, h2Style, dividerStyle, GridTexture, FadeIn } from "./shared";
import { StatusBadge } from "./products-grid";
import type { MarketingProduct } from "@/lib/marketing/products";

export function ProductDetail({ product }: { product: MarketingProduct }) {
  const live = product.status === "live";
  const signUpHref = product.productKey ? `/sign-up?product=${product.productKey}` : "/sign-up";

  return (
    <main>
      {/* Hero */}
      <section
        style={{
          padding: "72px 0 56px",
          position: "relative",
          background: `linear-gradient(to bottom, ${T.navyMid}, ${T.navy})`,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div style={containerStyle}>
          <FadeIn>
            <Link href="/products" style={{ ...labelStyle, color: T.muted, textDecoration: "none", fontSize: 11 }}>
              ← All products
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
              <span style={labelStyle}>{product.tag}</span>
              <StatusBadge live={live} />
            </div>
            <h1 style={{ ...h2Style, marginTop: 12, fontSize: "clamp(28px, 5vw, 44px)" }}>{product.name}</h1>
            <div style={dividerStyle} />
            <p style={{ fontSize: 18, lineHeight: 1.7, color: T.coldW, maxWidth: 720, fontWeight: 500 }}>{product.tagline}</p>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: T.muted, maxWidth: 720, marginTop: 16 }}>{product.summary}</p>
            <CtaRow live={live} signUpHref={signUpHref} />
          </FadeIn>
        </div>
      </section>

      {/* Highlights */}
      <section style={{ ...sectionBase, padding: "88px 0", background: T.navy }}>
        <div style={containerStyle}>
          <FadeIn style={{ marginBottom: 48 }}>
            <span style={labelStyle}>Capabilities</span>
            <h2 style={{ ...h2Style, marginTop: 12, fontSize: "clamp(24px, 3.4vw, 34px)" }}>What you get.</h2>
            <div style={dividerStyle} />
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            {product.highlights.map((h, i) => (
              <FadeIn key={h.title} delay={i * 70}>
                <div style={{ background: T.navyMid, border: `1px solid ${T.border}`, padding: "30px 26px", height: "100%" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.coldW, marginBottom: 12, fontFamily: "'Playfair Display', serif" }}>{h.title}</h3>
                  <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.75 }}>{h.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Lifecycle */}
      <section style={{ ...sectionBase, padding: "88px 0", background: T.navyMid }}>
        <GridTexture />
        <div style={containerStyle}>
          <FadeIn style={{ marginBottom: 48 }}>
            <span style={labelStyle}>How it works</span>
            <h2 style={{ ...h2Style, marginTop: 12, fontSize: "clamp(24px, 3.4vw, 34px)" }}>The lifecycle.</h2>
            <div style={dividerStyle} />
          </FadeIn>
          <div style={{ display: "grid", gap: 20 }}>
            {product.lifecycle.map((s, i) => (
              <FadeIn key={s.step} delay={i * 70}>
                <div style={{ display: "flex", gap: 20, alignItems: "flex-start", background: T.navy, border: `1px solid ${T.border}`, padding: "24px 26px" }}>
                  <span style={{
                    flexShrink: 0, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${T.goldDim}`, color: T.gold, fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700,
                  }}>
                    {i + 1}
                  </span>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: T.coldW, marginBottom: 6 }}>{s.step}</h3>
                    <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>{s.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance + bottom CTA */}
      <section style={{ ...sectionBase, padding: "88px 0", background: T.navy }}>
        <div style={containerStyle}>
          {product.compliance && (
            <FadeIn style={{ marginBottom: 48 }}>
              <div style={{ borderLeft: `2px solid ${T.gold}`, paddingLeft: 24, maxWidth: 760 }}>
                <span style={labelStyle}>Compliance</span>
                <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.75, marginTop: 12 }}>{product.compliance}</p>
              </div>
            </FadeIn>
          )}
          <FadeIn>
            <div style={{ background: T.navyMid, border: `1px solid ${T.border}`, padding: "44px 40px", textAlign: "center" }}>
              <h2 style={{ ...h2Style, fontSize: "clamp(22px, 3vw, 30px)", marginBottom: 12 }}>
                {live ? `Ready to launch ${product.tag.toLowerCase()}?` : `Interested in ${product.tag.toLowerCase()}?`}
              </h2>
              <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, maxWidth: 520, margin: "0 auto 24px" }}>
                {live
                  ? "Start in the issuer workspace, or talk to us about embedding QBridge as infrastructure."
                  : "This product is on the roadmap. Request early access and we'll bring you in as it goes live."}
              </p>
              <CtaRow live={live} signUpHref={signUpHref} center />
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}

function CtaRow({ live, signUpHref, center }: { live: boolean; signUpHref: string; center?: boolean }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 28, justifyContent: center ? "center" : "flex-start" }}>
      {live ? (
        <>
          <CtaButton href={signUpHref} primary>Get started</CtaButton>
          <CtaButton href="/contact">Talk to us about infrastructure</CtaButton>
        </>
      ) : (
        <>
          <CtaButton href="/contact" primary>Request early access</CtaButton>
          <CtaButton href="/products">Browse all products</CtaButton>
        </>
      )}
    </div>
  );
}

function CtaButton({ href, children, primary }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "12px 24px",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textDecoration: "none",
        borderRadius: 2,
        border: `1px solid ${primary ? T.gold : T.navyBdr}`,
        background: primary ? T.gold : "transparent",
        color: primary ? T.navy : T.coldW,
        transition: "opacity 0.2s, border-color 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; if (!primary) e.currentTarget.style.borderColor = T.gold; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; if (!primary) e.currentTarget.style.borderColor = T.navyBdr; }}
    >
      {children}
    </Link>
  );
}
