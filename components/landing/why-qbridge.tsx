"use client";

import { T, sectionBase, containerStyle, labelStyle, h2Style, bodyStyle, dividerStyle, GridTexture, FadeIn } from "./shared";

const points = [
  { label: "Compliance by Design", vs: "Compliance bolted on after", desc: "Regulatory logic is embedded at the protocol layer — not layered on top through middleware or manual processes." },
  { label: "Multi-Jurisdiction Native", vs: "Single market focused", desc: "Configurable rule sets for US, EU, and Canadian markets from a single infrastructure deployment." },
  { label: "Privacy-Preserving Verification", vs: "On-chain identity exposure", desc: "ZK proofs let institutions demonstrate compliance without exposing sensitive identity or transaction data." },
  { label: "Institutional Grade", vs: "Retail crypto products", desc: "Built exclusively for regulated institutions — asset managers, banks, and capital market operators." },
  { label: "AI-Enhanced Operations", vs: "Manual monitoring & reporting", desc: "Intelligent automation reduces compliance overhead and accelerates time-to-market for digital asset programs." },
];

export function WhyQBridge() {
  return (
    <section style={{ ...sectionBase, background: T.navy }}>
      <GridTexture />
      <div style={containerStyle}>
        <FadeIn style={{ marginBottom: 72 }}>
          <span style={labelStyle}>Why QBridge</span>
          <h2 style={{ ...h2Style, marginTop: 12 }}>
            Purpose-built for regulated institutions.
          </h2>
          <div style={dividerStyle} />
          <p style={bodyStyle}>
            QBridge doesn&apos;t adapt retail blockchain tools for institutional use.
            We architect infrastructure specifically for the compliance, governance,
            and scalability demands of regulated capital markets.
          </p>
        </FadeIn>

        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 2, marginBottom: 2 }}>
            <div style={{ ...labelStyle, padding: "12px 0", fontSize: 10 }}>QBridge</div>
            <div style={{ ...labelStyle, padding: "12px 0", fontSize: 10, color: T.muted }}>Others</div>
            <div style={{ ...labelStyle, padding: "12px 0", fontSize: 10, color: T.muted }}>Why it matters</div>
          </div>
          {points.map((p, i) => (
            <FadeIn key={p.label} delay={i * 60}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 2fr",
                gap: 2,
                background: i % 2 === 0 ? T.navyMid : T.navy,
                padding: "20px 0",
                borderTop: `1px solid ${T.border}`,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.gold, paddingRight: 16 }}>✓ {p.label}</div>
                <div style={{ fontSize: 13, color: T.muted, paddingRight: 16 }}>✗ {p.vs}</div>
                <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.65 }}>{p.desc}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
