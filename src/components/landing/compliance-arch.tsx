"use client";

import { T, sectionBase, containerStyle, labelStyle, h2Style, bodyStyle, dividerStyle, GridTexture, FadeIn } from "./shared";

const items: [string, string][] = [
  ["Transfer Restriction Engine", "Enforce hold periods, investor caps, jurisdiction blocks, and resale restrictions at the smart contract level."],
  ["Investor Eligibility Controls", "Configurable accredited, qualified, and institutional investor eligibility per asset class and jurisdiction."],
  ["Real-Time Compliance Monitoring", "Continuous on-chain event monitoring with automated flagging of violations, anomalies, and reporting triggers."],
  ["Privacy-Preserving KYC/AML", "ZK proofs allow institutions to verify investor compliance without storing or exposing sensitive personal data on-chain."],
  ["Regulatory Reporting Automation", "Structured reporting pipelines map on-chain activity to regulatory disclosure formats — reducing manual reconciliation overhead."],
  ["Immutable Audit Trail", "Every compliance event, identity verification, and governance action is recorded immutably for examination-ready audit logs."],
];

const jurisdictions = ["US SEC / Reg D", "EU MiCA", "Canadian NI 45-106", "FATF Travel Rule"];

export function ComplianceArch() {
  return (
    <section style={{ ...sectionBase, background: T.navyMid }}>
      <GridTexture />
      <div style={containerStyle}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
          <FadeIn>
            <span style={labelStyle}>Compliance Architecture</span>
            <h2 style={{ ...h2Style, marginTop: 12 }}>
              Regulatory integrity is structural — not optional.
            </h2>
            <div style={dividerStyle} />
            <p style={bodyStyle}>
              QBridge&apos;s compliance architecture is designed for examination-readiness from day one.
              Every transfer, every verification, every governance action is traceable, configurable,
              and enforceable at the protocol layer — across multiple regulatory regimes simultaneously.
            </p>

            <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap" }}>
              {jurisdictions.map(tag => (
                <span key={tag} style={{
                  border: `1px solid ${T.navyBdr}`,
                  color: T.muted,
                  fontSize: 11,
                  padding: "5px 12px",
                  letterSpacing: "0.06em",
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={150}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {items.map(([title, desc], i) => (
                <div key={title} style={{
                  background: T.navy,
                  border: `1px solid ${T.border}`,
                  padding: "22px 24px",
                  display: "flex", gap: 16, alignItems: "flex-start",
                  transition: "border-color 0.2s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = T.goldDim)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
                  <span style={{ color: T.gold, fontFamily: "'DM Mono', monospace", fontSize: 12, marginTop: 1, flexShrink: 0 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.coldW, marginBottom: 6 }}>{title}</div>
                    <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.65 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
