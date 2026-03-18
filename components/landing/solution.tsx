"use client";

import { T, sectionBase, containerStyle, labelStyle, h2Style, bodyStyle, dividerStyle, GridTexture, FadeIn } from "./shared";

const layers = [
  { layer: "Asset Layer", desc: "Token issuance · lifecycle · transfers", color: T.coldW },
  { layer: "Compliance Layer", desc: "Transfer rules · investor eligibility · KYC/AML", color: T.gold },
  { layer: "Identity Layer", desc: "DID · ZK verification · on-chain attestations", color: T.accent },
  { layer: "Governance Layer", desc: "Multi-sig · access controls · audit trail", color: "#7C9CBF" },
  { layer: "Infrastructure", desc: "EVM-compatible · multi-jurisdiction rails", color: T.muted },
];

export function Solution() {
  return (
    <section style={{ ...sectionBase, background: T.navy }}>
      <GridTexture />
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 1, height: "100%", background: T.border }} />
      <div style={containerStyle}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <FadeIn>
            <span style={labelStyle}>The Solution</span>
            <h2 style={{ ...h2Style, marginTop: 12 }}>
              Compliance engineered into the foundation — not added on top.
            </h2>
            <div style={dividerStyle} />
            <p style={{ ...bodyStyle, marginBottom: 32 }}>
              QBridge embeds regulatory logic, identity controls, transfer restrictions, and
              audit trails directly into the protocol layer. Every asset issued on QBridge
              is compliant by design — across jurisdictions, from day one.
            </p>
            <p style={bodyStyle}>
              We don&apos;t offer workarounds. We build the infrastructure that makes compliant
              tokenization the default — not the exception.
            </p>
          </FadeIn>

          <FadeIn delay={150}>
            <div style={{
              background: T.navyMid,
              border: `1px solid ${T.navyBdr}`,
              padding: 40,
              position: "relative",
            }}>
              {layers.map((l, i) => (
                <div key={l.layer} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 0",
                  borderBottom: i < 4 ? `1px solid ${T.border}` : "none",
                }}>
                  <div style={{ width: 3, height: 32, background: l.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: l.color }}>{l.layer}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{l.desc}</div>
                  </div>
                </div>
              ))}
              <div style={{ position: "absolute", top: 16, right: 16, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T.gold, fontFamily: "'DM Mono', monospace" }}>
                Protocol Stack
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
