"use client";

import { T, sectionBase, containerStyle, labelStyle, h2Style, dividerStyle, GridTexture, FadeIn } from "./shared";

const layers = [
  { label: "Token Architecture", items: ["Custom ERC-20 Asset Logic", "ERC-1155 Support", "Modular Compliance Extensions"] },
  { label: "Identity & Verification", items: ["Decentralized Identifiers (DID)", "Zero-Knowledge Proofs", "On-Chain Attestations (EAS)"] },
  { label: "Compliance Engine", items: ["OpenZeppelin AccessManager", "Configurable Transfer Rules", "Proof-of-Reserve Mechanisms"] },
  { label: "AI Automation", items: ["Risk Event Detection", "Reporting Workflow Automation", "Anomaly Flagging"] },
  { label: "Integrations", items: ["EVM-Compatible Chains", "Institutional Custody APIs", "Traditional Capital Market Rails"] },
];

export function TechLayer() {
  return (
    <section style={{ ...sectionBase, background: T.navy }}>
      <GridTexture />
      <div style={containerStyle}>
        <FadeIn style={{ textAlign: "center", marginBottom: 72 }}>
          <span style={labelStyle}>Technology Layer</span>
          <h2 style={{ ...h2Style, marginTop: 12, textAlign: "center" }}>
            Built on proven standards. Designed for institutional scale.
          </h2>
          <div style={{ ...dividerStyle, margin: "16px auto 0" }} />
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
          {layers.map((l, i) => (
            <FadeIn key={l.label} delay={i * 80}>
              <div style={{
                borderTop: `2px solid ${i === 0 ? T.gold : i === 1 ? T.accent : T.navyBdr}`,
                paddingTop: 24,
              }}>
                <div style={{ ...labelStyle, marginBottom: 20, color: i === 0 ? T.gold : i === 1 ? T.accent : T.muted }}>
                  {l.label}
                </div>
                {l.items.map(item => (
                  <div key={item} style={{
                    fontSize: 13,
                    color: T.coldW,
                    padding: "8px 0",
                    borderBottom: `1px solid ${T.border}`,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ color: T.navyBdr }}>—</span> {item}
                  </div>
                ))}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
