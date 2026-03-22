"use client";

import { T, sectionBase, containerStyle, labelStyle, h2Style, dividerStyle, GridTexture, FadeIn } from "./shared";

const steps = [
  {
    n: "01",
    title: "Onboard & Configure",
    body: "Institutions connect to QBridge's infrastructure, configure jurisdiction-specific compliance rules, investor eligibility criteria, and governance policies through a secure admin layer.",
  },
  {
    n: "02",
    title: "Issue Tokenized Assets",
    body: "Deploy compliant token contracts for equities, credit instruments, real estate, or commodities. Every token encodes transfer restrictions, reporting obligations, and lifecycle rules at mint.",
  },
  {
    n: "03",
    title: "Verify Investors with ZK Proofs",
    body: "Investors are verified through privacy-preserving zero-knowledge mechanisms. Institutions confirm eligibility without exposing underlying identity or transactional data.",
  },
  {
    n: "04",
    title: "Monitor, Report & Scale",
    body: "AI-powered monitoring continuously tracks compliance events, flags anomalies, and automates regulatory reporting — enabling institutions to scale digital asset programs confidently.",
  },
];

export function HowItWorks() {
  return (
    <section style={{ ...sectionBase, background: T.navyMid }}>
      <GridTexture />
      <div style={containerStyle}>
        <FadeIn style={{ textAlign: "center", marginBottom: 72 }}>
          <span style={labelStyle}>How It Works</span>
          <h2 style={{ ...h2Style, marginTop: 12, textAlign: "center" }}>
            From issuance to reporting — in a single, compliant workflow.
          </h2>
          <div style={{ ...dividerStyle, margin: "16px auto 0" }} />
        </FadeIn>

        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute", top: 28, left: "calc(3.5rem)", right: "calc(3.5rem)",
            height: 1, background: `linear-gradient(to right, transparent, ${T.navyBdr} 10%, ${T.navyBdr} 90%, transparent)`,
          }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {steps.map((s, i) => (
              <FadeIn key={s.n} delay={i * 100}>
                <div style={{ padding: "0 8px" }}>
                  <div style={{
                    width: 56, height: 56,
                    border: `1px solid ${T.gold}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 24,
                    background: T.navy,
                    position: "relative",
                    zIndex: 1,
                  }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: T.gold }}>{s.n}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.coldW, marginBottom: 12 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.75 }}>{s.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
