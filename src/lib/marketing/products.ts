// ============================================================
// lib/marketing/products.ts
//
// Marketing content registry for QBridge product lines (asset classes).
// Drives the /products index + the dynamic /products/[slug] pages. This
// is MARKETING content only — the live product logic lives in
// src/lib/products/ (the app-layer product registry). Keep the slugs in
// sync where a product is "live".
// ============================================================

export type ProductStatus = "live" | "coming-soon";

export interface ProductStep {
  step: string;
  body: string;
}

export interface ProductHighlight {
  title: string;
  body: string;
}

export interface MarketingProduct {
  slug: string;
  /** Short badge / nav label. */
  tag: string;
  /** Page + card title. */
  name: string;
  status: ProductStatus;
  /** One-line hero subtitle. */
  tagline: string;
  /** Intro paragraph (card + hero). */
  summary: string;
  /** In-app destination for live products (issuer workspace). */
  workspacePath?: string;
  highlights: ProductHighlight[];
  /** "How it works" lifecycle. */
  lifecycle: ProductStep[];
  /** Regulatory / compliance note. */
  compliance?: string;
}

export const MARKETING_PRODUCTS: MarketingProduct[] = [
  {
    slug: "real-estate",
    tag: "Real Estate",
    name: "Real Estate Tokenization",
    status: "live",
    tagline: "Tokenize institutional real estate with compliance built into the token.",
    summary:
      "Deploy a compliant SPV token with share classes, a NAV oracle, capital calls, and distributions — accredited-investor and jurisdiction rules enforced on-chain at every transfer.",
    workspacePath: "/workspace/assets",
    highlights: [
      { title: "On-chain transfer restrictions", body: "Hold periods, investor caps, and jurisdiction blocks execute at the contract level — not in middleware." },
      { title: "Investor eligibility", body: "Accredited / qualified / institutional verification enforced per class and jurisdiction before any transfer." },
      { title: "NAV, distributions & capital calls", body: "Attested valuations, programmable distributions, and capital-call workflows built into the deal cluster." },
      { title: "Automated cap table", body: "The chain is the register — positions, classes, and sub-tiers are always reconciled." },
    ],
    lifecycle: [
      { step: "Create the deal", body: "Deploy a per-deal cluster (token, compliance, identity, NAV oracle, distribution, capital-call) in one transaction." },
      { step: "Onboard investors", body: "Verify identity, accreditation, and jurisdiction in the deal's identity registry." },
      { step: "Issue & distribute", body: "Mint share classes to eligible holders; run distributions and capital calls on-chain." },
    ],
    compliance:
      "Structured as a Reg D security offering — accredited-investor and hold-period logic is enforced by the token, not bolted on after.",
  },
  {
    slug: "stablecoins",
    tag: "Stablecoins",
    name: "Stablecoin Issuance",
    status: "live",
    tagline: "Issue a fiat-backed, proof-of-reserves stablecoin — non-custodial by design.",
    summary:
      "Launch a payment stablecoin where every token is backed by attested reserves and every transfer honors your compliance policy. Attest reserves, mint, and run redemptions from one dashboard.",
    workspacePath: "/workspace/stablecoins",
    highlights: [
      { title: "Proof-of-reserves gating", body: "Issuance is blocked unless attested reserves cover supply. No proven reserves, no tokens — enforced on every mint." },
      { title: "Mint & redemption controls", body: "Issue against reserves and run an on-chain redemption queue: request → settle → burn, with the fiat leg off-chain." },
      { title: "Policy-based compliance", body: "Choose Allowlist (KYC'd holders only) or Blocklist (open circulation, sanctions-screened). Freeze and seize for OFAC / court orders." },
      { title: "Non-custodial", body: "QBridge never holds funds. Reserves stay with the issuer; the chain only tracks the tokenized claim." },
    ],
    lifecycle: [
      { step: "Attest reserves", body: "Record your backing total on the reserve oracle — the ceiling for all issuance." },
      { step: "Issue", body: "Mint to compliant recipients, never exceeding fresh attested reserves." },
      { step: "Circulate", body: "Holders transfer under your policy; sanctioned addresses are blocked automatically." },
      { step: "Redeem", body: "Burn on-chain through the redemption queue; wire the fiat off-chain." },
    ],
    compliance:
      "A fiat payment stablecoin is e-money / money transmission (US GENIUS Act + state MTLs; EU MiCA EMI). Licensing is a prerequisite — QBridge provides the rails, not the license.",
  },
  {
    slug: "private-markets",
    tag: "Private Equity & VC",
    name: "Private Markets & Fund Interests",
    status: "coming-soon",
    tagline: "Tokenize private equity, venture, and fund (LP) interests.",
    summary:
      "Unlock secondary liquidity for traditionally illiquid interests — with automated cap tables, capital calls, distributions, and investor eligibility enforced on-chain.",
    highlights: [
      { title: "LP interest tokens", body: "Fund and SPV interests as compliant, transfer-restricted tokens." },
      { title: "Capital calls & distributions", body: "Programmable drawdowns and waterfall distributions." },
      { title: "Secondary liquidity", body: "Eligibility-gated transfers open a compliant secondary market." },
    ],
    lifecycle: [
      { step: "Structure the vehicle", body: "Configure classes, waterfalls, and eligibility rules." },
      { step: "Onboard LPs", body: "Verify accreditation and jurisdiction." },
      { step: "Operate", body: "Run calls, distributions, and secondary transfers on-chain." },
    ],
    compliance: "Reg D / private-placement eligibility enforced at the token layer.",
  },
  {
    slug: "private-credit",
    tag: "Credit & Fixed Income",
    name: "Tokenized Debt Instruments",
    status: "coming-soon",
    tagline: "Digitize private credit, structured notes, and fixed income.",
    summary:
      "Programmable coupon payments, maturity logic, and reporting pipelines aligned to disclosure obligations — for private credit and structured instruments.",
    highlights: [
      { title: "Programmable coupons", body: "Automated interest schedules and payment logic." },
      { title: "Maturity & lifecycle", body: "Redemption and maturity handling encoded on-chain." },
      { title: "Disclosure-aligned reporting", body: "Reporting pipelines built for regulated fixed income." },
    ],
    lifecycle: [
      { step: "Issue the instrument", body: "Configure principal, coupon, and maturity terms." },
      { step: "Service", body: "Pay coupons and report on schedule." },
      { step: "Redeem", body: "Handle maturity and redemption on-chain." },
    ],
    compliance: "Structured as compliant debt securities with disclosure-aligned reporting.",
  },
  {
    slug: "commodities",
    tag: "Commodities & Energy",
    name: "Commodity & Energy-Backed Tokens",
    status: "coming-soon",
    tagline: "Tokenize energy, infrastructure, gold, and commodities.",
    summary:
      "Compliant commodity and energy-backed tokens with proof-of-reserve attestation, transparent audit trails, and configurable redemption mechanics for institutional exposure on-chain.",
    highlights: [
      { title: "Proof-of-reserve", body: "Attested backing for physical commodities and reserves." },
      { title: "Redemption mechanics", body: "Configurable settlement and redemption workflows." },
      { title: "Audit trails", body: "Transparent, on-chain provenance and reporting." },
    ],
    lifecycle: [
      { step: "Attest backing", body: "Record reserves / warehouse holdings on-chain." },
      { step: "Issue", body: "Mint tokens representing verified exposure." },
      { step: "Redeem", body: "Settle against the underlying per your terms." },
    ],
    compliance: "Structured as compliant asset-backed security tokens with reserve attestation.",
  },
  {
    slug: "banking-treasury",
    tag: "Banking & Treasury",
    name: "Tokenized Deposits & Funds",
    status: "coming-soon",
    tagline: "Tokenized deposits, money market funds, and treasury instruments.",
    summary:
      "Enable banks and financial institutions to issue tokenized deposits and treasury instruments — with on-chain settlement, programmable controls, and the audit and compliance rails regulators expect.",
    highlights: [
      { title: "On-chain settlement", body: "Instant, final settlement for deposits and fund units." },
      { title: "Programmable controls", body: "Institutional transfer and eligibility rules." },
      { title: "Regulator-grade audit", body: "Full audit and compliance rails built in." },
    ],
    lifecycle: [
      { step: "Issue", body: "Tokenize deposits or fund units." },
      { step: "Settle", body: "Move value with on-chain finality." },
      { step: "Report", body: "Produce regulator-grade audit trails." },
    ],
    compliance: "Built for regulated banking and fund structures.",
  },
  {
    slug: "emerging",
    tag: "Emerging Classes",
    name: "Custom & Emerging Asset Classes",
    status: "coming-soon",
    tagline: "Carbon credits, IP & royalties, trade finance, and beyond.",
    summary:
      "If it can be structured as a compliant instrument, QBridge gives you the rails to tokenize it — carbon credits, infrastructure, intellectual property and royalties, trade finance, and more.",
    highlights: [
      { title: "Flexible instruments", body: "Configure token, compliance, and lifecycle to fit the asset." },
      { title: "Shared platform", body: "Reuse QBridge identity, wallet, and registry infrastructure." },
      { title: "API & white-label", body: "Embed QBridge tokenization into your own product." },
    ],
    lifecycle: [
      { step: "Design", body: "Model the instrument and its compliance rules." },
      { step: "Deploy", body: "Spin up a product module on the shared platform." },
      { step: "Operate", body: "Issue and manage from the dashboard or via API." },
    ],
  },
];

export function getMarketingProduct(slug: string): MarketingProduct | undefined {
  return MARKETING_PRODUCTS.find((p) => p.slug === slug);
}
