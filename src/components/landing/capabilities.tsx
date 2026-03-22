"use client";

import { T, sectionBase, containerStyle, labelStyle, h2Style, dividerStyle, GridTexture, FadeIn } from "./shared";

const caps = [
  { icon: "⬡", title: "Protocol-Level Compliance", body: "Regulatory logic baked into smart contracts — not middleware. Transfer restrictions, reporting thresholds, and eligibility rules execute on-chain automatically." },
  { icon: "🌍", title: "Multi-Jurisdiction Configuration", body: "Support for US, EU, and Canadian regulatory frameworks. Configurable compliance rules adapt to evolving requirements across markets without redeployment." },
  { icon: "🔐", title: "Zero-Knowledge Verification", body: "Prove investor eligibility and regulatory compliance without exposing identity or transaction data. Privacy-preserving by design." },
  { icon: "🤖", title: "AI-Driven Monitoring", body: "Intelligent automation layers monitor risk events, flag compliance deviations, and streamline audit reporting — reducing manual overhead at scale." },
  { icon: "🆔", title: "On-Chain Identity Controls", body: "Decentralized identity (DID) and on-chain attestations enforce KYC/AML compliance at the transfer level, with full auditability." },
  { icon: "📋", title: "Programmable Governance", body: "Multi-signature authorization, execution delays, guardian roles, and access control hierarchies — all configurable to institutional governance standards." },
  { icon: "🔗", title: "EVM-Compatible Rails", body: "Built on battle-tested EVM infrastructure with custom ERC-20 asset logic, modular compliance controls, and institutional wallet and custody integrations." },
  { icon: "📈", title: "Lifecycle Management", body: "End-to-end asset lifecycle: issuance, secondary transfers, corporate actions, redemptions, and sunset — all governed by embedded compliance logic." },
];

export function Capabilities() {
  return (
    <section id="platform" style={{ ...sectionBase, background: T.navy }}>
      <GridTexture />
      <div style={containerStyle}>
        <FadeIn style={{ marginBottom: 64 }}>
          <span style={labelStyle}>Key Capabilities</span>
          <h2 style={{ ...h2Style, marginTop: 12 }}>
            Infrastructure built for every layer of institutional compliance.
          </h2>
          <div style={dividerStyle} />
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(256px, 1fr))", gap: 1, background: T.border }}>
          {caps.map((c, i) => (
            <FadeIn key={c.title} delay={i * 60}>
              <div style={{
                background: T.navy,
                padding: "36px 28px",
                transition: "background 0.2s",
                cursor: "default",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = T.navyMid)}
                onMouseLeave={e => (e.currentTarget.style.background = T.navy)}>
                <div style={{ fontSize: 22, marginBottom: 14, color: T.gold }}>{c.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.coldW, marginBottom: 10 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.75 }}>{c.body}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
