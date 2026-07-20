"use client";

import Link from "next/link";
import { T, sectionBase, containerStyle, labelStyle, h2Style, dividerStyle, GridTexture, FadeIn } from "./shared";

const cases = [
  {
    slug: "real-estate",
    status: "live" as const,
    tag: "Real Estate",
    title: "Real Estate Tokenization",
    body: "Fractional ownership of institutional real estate assets with embedded transfer restrictions, accredited investor verification, and jurisdiction-specific compliance configurations.",
  },
  {
    slug: "private-markets",
    status: "coming-soon" as const,
    tag: "Private Equity & VC",
    title: "Private Markets & Fund Interests",
    body: "Tokenize private equity, venture, and fund (LP) interests to unlock secondary liquidity for traditionally illiquid assets — with automated cap tables, capital calls, distributions, and investor eligibility enforced on-chain.",
  },
  {
    slug: "private-credit",
    status: "coming-soon" as const,
    tag: "Credit & Fixed Income",
    title: "Tokenized Debt Instruments",
    body: "Digitize private credit, structured notes, and fixed income instruments with programmable coupon payments, maturity logic, and reporting pipelines aligned to disclosure obligations.",
  },
  {
    slug: "commodities",
    status: "coming-soon" as const,
    tag: "Commodities & Energy",
    title: "Commodity & Energy-Backed Tokens",
    body: "Tokenize energy and infrastructure projects, gold, and commodities as compliant security tokens — with proof-of-reserve attestation, transparent audit trails, and configurable redemption mechanics for institutional exposure on-chain.",
  },
  {
    slug: "stablecoins",
    status: "live" as const,
    tag: "Stablecoins",
    title: "Stablecoin Issuance",
    body: "Launch fiat-pegged or reserve-backed stablecoins with proof-of-reserve attestation, programmable mint and burn controls, and jurisdiction-aware compliance built into the token layer.",
  },
  {
    slug: "banking-treasury",
    status: "coming-soon" as const,
    tag: "Banking & Treasury",
    title: "Tokenized Deposits & Funds",
    body: "Enable banks and financial institutions to issue tokenized deposits, money market funds, and treasury instruments — with on-chain settlement, programmable controls, and the audit and compliance rails regulators expect.",
  },
  {
    slug: "emerging",
    status: "coming-soon" as const,
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
            <FadeIn key={c.title} delay={i * 80} style={{ height: "100%" }}>
              <Link
                href={`/products/${c.slug}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  textDecoration: "none",
                  background: T.navy,
                  border: `1px solid ${T.border}`,
                  padding: "36px 28px",
                  height: "100%",
                  transition: "border-color 0.2s, transform 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.goldDim; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "none"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <span style={{
                    ...labelStyle, fontSize: 10,
                    border: `1px solid ${T.navyBdr}`,
                    padding: "3px 10px",
                    color: T.muted,
                  }}>
                    {c.tag}
                  </span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: T.coldW, marginBottom: 14, fontFamily: "'Playfair Display', serif" }}>
                  {c.title}
                </h3>
                <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.75, flex: 1 }}>{c.body}</p>
                <span style={{ marginTop: 20, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: T.accent, fontFamily: "'DM Mono', monospace" }}>
                  {c.status === "live" ? "Explore →" : "Learn more →"}
                </span>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
