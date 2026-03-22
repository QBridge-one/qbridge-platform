"use client";

import Image from "next/image";
import { T, containerStyle, bodyStyle, FadeIn, Pill } from "./shared";

export function Hero() {
  return (
    <section style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background image */}
      <Image
        src="/hero-bg.png"
        alt=""
        fill
        priority
        style={{ objectFit: "cover", objectPosition: "center", zIndex: 0 }}
      />

      {/* Dark overlay so text stays legible */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to right, rgba(8,14,26,0.82) 55%, rgba(8,14,26,0.3) 100%)",
        zIndex: 1,
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{ ...containerStyle, paddingTop: 100, position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: 820 }}>
          <FadeIn delay={40}>
            <Pill>Institutional Infrastructure · RWA Tokenization</Pill>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(38px, 5.5vw, 72px)",
              fontWeight: 700,
              color: T.coldW,
              lineHeight: 1.1,
              marginBottom: 28,
              letterSpacing: "-0.01em",
            }}>
              Compliant Digital Asset<br />
              Infrastructure for{" "}
              <span style={{ color: T.warm }}>Regulated Markets.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p style={{ ...bodyStyle, fontSize: 18, maxWidth: 620, marginBottom: 48 }}>
              QBridge provides institutional-grade blockchain rails for real-world asset tokenization —
              with compliance, identity controls, and auditability embedded directly into the protocol layer.
              Built for financial institutions, not retail crypto.
            </p>
          </FadeIn>
          <FadeIn delay={300}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <a href="#contact" style={{
                background: T.warm,
                color: T.navy,
                padding: "14px 32px",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
                fontFamily: "'DM Mono', monospace",
                transition: "opacity 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                Request a Demo
              </a>
              <a href="#platform" style={{
                background: "transparent",
                border: `1px solid ${T.navyBdr}`,
                color: T.muted,
                padding: "14px 32px",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.muted; e.currentTarget.style.color = T.coldW; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.navyBdr; e.currentTarget.style.color = T.muted; }}>
                Explore Platform →
              </a>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={500}>
          <div style={{
            marginTop: 96,
            paddingTop: 40,
            borderTop: `1px solid ${T.border}`,
            display: "flex",
            gap: 64,
            flexWrap: "wrap",
          }}>
            {[
              { val: "3+", label: "Regulatory Jurisdictions" },
              { val: "ERC-20+", label: "Custom Token Ecosystems" },
              { val: "ZK", label: "Privacy-Preserving Verification" },
              { val: "AI", label: "Automated Risk Monitoring" },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: T.coldW }}>{s.val}</div>
                <div style={{ fontSize: 12, color: T.muted, letterSpacing: "0.08em", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
