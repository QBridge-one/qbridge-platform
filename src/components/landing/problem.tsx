"use client";

import { T, sectionBase, containerStyle, labelStyle, h2Style, bodyStyle, dividerStyle, GridTexture, FadeIn } from "./shared";

const problems = [
  {
    icon: "⚖",
    title: "Compliance is an afterthought",
    body: "Most tokenization platforms layer compliance on top of existing infrastructure — creating brittle, jurisdiction-specific workarounds that fail at scale.",
  },
  {
    icon: "🌐",
    title: "Multi-jurisdiction complexity",
    body: "Operating across the US, EU, and Canada requires distinct regulatory logic. Most systems can't configure transfer restrictions, reporting, and investor eligibility per market.",
  },
  {
    icon: "🔒",
    title: "Privacy vs. transparency tension",
    body: "Institutions must prove compliance to regulators without exposing sensitive client or transactional data. Current solutions force an unacceptable trade-off.",
  },
  {
    icon: "📊",
    title: "Manual reporting overhead",
    body: "Risk monitoring, regulatory reporting, and audit trails are largely manual — slowing time-to-market and increasing operational risk.",
  },
];

export function Problem() {
  return (
    <section style={{ ...sectionBase, background: T.navyMid }}>
      <GridTexture />
      <div style={containerStyle}>
        <FadeIn>
          <span style={labelStyle}>The Problem</span>
          <h2 style={{ ...h2Style, marginTop: 12 }}>
            Traditional infrastructure wasn&apos;t built<br />for regulated digital assets.
          </h2>
          <div style={dividerStyle} />
          <p style={{ ...bodyStyle, marginBottom: 64 }}>
            Tokenizing real-world assets is operationally complex and heavily regulated.
            Existing infrastructure forces institutions to choose between speed and compliance — a trade-off that shouldn&apos;t exist.
          </p>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 2 }}>
          {problems.map((p, i) => (
            <FadeIn key={p.title} delay={i * 80}>
              <div style={{
                background: T.navy,
                border: `1px solid ${T.border}`,
                padding: "36px 32px",
                transition: "border-color 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = T.goldDim)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
                <div style={{ fontSize: 24, marginBottom: 16 }}>{p.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.coldW, marginBottom: 10 }}>{p.title}</div>
                <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.7 }}>{p.body}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
