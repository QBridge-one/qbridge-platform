"use client";

import { T, sectionBase, containerStyle, labelStyle, h2Style, dividerStyle, GridTexture, FadeIn } from "./shared";

const cases = [
  {
    tag: "Real Estate",
    title: "Real Estate Tokenization",
    body: "Fractional ownership of institutional real estate assets with embedded transfer restrictions, accredited investor verification, and jurisdiction-specific compliance configurations.",
  },
  {
    tag: "Private Equity & VC",
    title: "Private Markets & Fund Interests",
    body: "Tokenize private equity, venture, and fund (LP) interests to unlock secondary liquidity for traditionally illiquid assets — with automated cap tables, capital calls, distributions, and investor eligibility enforced on-chain.",
  },
  {
    tag: "Credit & Fixed Income",
    title: "Tokenized Debt Instruments",
    body: "Digitize private credit, structured notes, and fixed income instruments with programmable coupon payments, maturity logic, and reporting pipelines aligned to disclosure obligations.",
  },
  {
    tag: "Commodities & Energy",
    title: "Commodity & Energy-Backed Tokens",
    body: "Tokenize energy and infrastructure projects, gold, and commodities as compliant security tokens — with proof-of-reserve attestation, transparent audit trails, and configurable redemption mechanics for institutional exposure on-chain.",
  },
  {
    tag: "Stablecoins",
    title: "Stablecoin Issuance",
    body: "Launch fiat-pegged or reserve-backed stablecoins with proof-of-reserve attestation, programmable mint and burn controls, and jurisdiction-aware compliance built into the token layer.",
  },
  {
    tag: "Banking & Treasury",
    title: "Tokenized Deposits & Funds",
    body: "Enable banks and financial institutions to issue tokenized deposits, money market funds, and treasury instruments — with on-chain settlement, programmable controls, and the audit and compliance rails regulators expect.",
  },
  {
    tag: "Emerging Classes",
    title: "Custom & Emerging Asset Classes",
    body: "Carbon credits, infrastructure, intellectual property and royalties, trade finance, funds, and beyond. If it can be structured as a compliant instrument, QBridge gives you the rails to tokenize it.",
  },
];

export function UseCases() {
  return (
    <section style={{ ...sectionBase, background: T.navyMid }}>
      <GridTexture />
      <div style={containerStyle}>
        <FadeIn style={{ marginBottom: 64 }}>
          <span style={labelStyle}>Use Cases</span>
          <h2 style={{ ...h2Style, marginTop: 12 }}>
            Institutional-grade tokenization across asset classes.
          </h2>
          <div style={dividerStyle} />
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {cases.map((c, i) => (
            <FadeIn key={c.title} delay={i * 80}>
              <div style={{
                background: T.navy,
                border: `1px solid ${T.border}`,
                padding: "36px 28px",
                height: "100%",
                transition: "border-color 0.2s, transform 0.2s",
                cursor: "default",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.goldDim; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "none"; }}>
                <span style={{
                  ...labelStyle, fontSize: 10,
                  border: `1px solid ${T.navyBdr}`,
                  padding: "3px 10px",
                  display: "inline-block",
                  marginBottom: 20,
                  color: T.muted,
                }}>
                  {c.tag}
                </span>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: T.coldW, marginBottom: 14, fontFamily: "'Playfair Display', serif" }}>
                  {c.title}
                </h3>
                <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.75 }}>{c.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
