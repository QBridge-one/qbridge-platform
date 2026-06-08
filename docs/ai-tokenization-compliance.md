# AI-assisted tokenization & compliance — vision / TODO

> **Status: TODO — not started.** This is a direction note, not implemented.
> Captures the "faster tokenization with AI" idea and the honest, grounded
> recommendation for how to pursue it. Revisit before building any
> document-ingestion / compliance-automation feature.

## The original idea

"One-click tokenization": an issuer brings the deal's documents (offering
memorandum / PPM, operating agreement, subscription agreement, term sheet),
AI extracts the relevant conditions / regulations / compliance terms, and
those get injected into the on-chain compliance checker — so setup is fast.

## Reality check (grounded in the contracts)

The on-chain `RealEstateComplianceChecker` is **not a programmable rules
engine** — it hardcodes a single regulatory regime (US Reg D 506, real
estate). You **cannot inject arbitrary document-derived conditions** into it.

What it actually enforces (`canTransfer` / `_authorizeTransfer`):
- recipient passes **KYC + jurisdiction** (via the per-deal IdentityRegistry),
- recipient is **accredited**, or one of **≤35 sophisticated unaccredited**
  Class-A holders,
- **hold periods** (Class A / AA),
- every transfer needs a **per-transfer approval** carrying a signed
  **agreement hash**, issued by an **off-chain authority**
  (`setAccreditation`, `_approvals`).

What our wizard sets today: only the three init numbers —
`accreditationValidity`, `holdPeriodClassA`, `holdPeriodClassAA`. Everything
else (accreditation records, transfer approvals) is runtime, off-chain-driven,
and currently has **no UI**.

**Conclusion:** most of a deal's "conditions/regulations" are off-chain legal
/ operational policy. Only a thin slice maps to on-chain transfer gating. So
the leverage is *not* "AI fills the compliance contract."

## Recommended direction

Two products around the contract, not inside it:

### 1. Setup copilot — "docs → a reviewed deal spec"
Ingest offering docs → produce a **structured, cited** draft of: economics /
share classes (→ `DealConfig`), hold periods / accreditation rules (→ the 3
on-chain params), disclosures, investor eligibility, jurisdiction limits.
Every field links back to the source clause. **Pre-fills the wizard; a human
approves.** Buildable on top of what exists today.

### 2. The real business — AI-native compliance / transfer-agent layer
The contract delegates the hard parts off-chain: *who is accredited* and *is
this transfer allowed* (the approval + agreement hash). That off-chain
authority is the product:
- compile each deal's legal docs into a **versioned, machine-checkable
  compliance policy**,
- run investor onboarding, subscriptions, and every transfer against it,
- generate the on-chain accreditation records / approvals + the agreement,
  with humans signing off.

Recurring, sticky revenue (compliance-as-a-service / transfer agent), vs. a
one-time form-fill.

**Defensible framing:** be the **policy compiler + enforcement** for RWA —
turn legal documents into a cited, versioned, enforceable compliance policy
across the lifecycle. On-chain is the enforcement *floor*; the off-chain
policy + approval engine is the moat. Sell **speed + auditability + lower
compliance headcount**.

Vertical note: today's stack is single-regime (US Reg D, real estate). Other
regimes/jurisdictions mean new compliance contracts **or** pushing logic into
the off-chain policy layer. Don't oversell "any RWA, any jurisdiction on-chain."

## Honest cautions
- **Never auto-apply AI to compliance.** Human-in-the-loop, source citations,
  confidence scores, immutable audit trail. AI drafts/flags; a compliance
  person signs. This is legal liability, not a chatbot.
- Grounded extraction only (citations); never silently map a clause to a
  stricter/looser on-chain value.
- **Issuing accreditation / transfer approvals may itself be regulated**
  (transfer-agent / broker-dealer adjacency). Get counsel early; may be a
  partnership — and that gatekeeping role is also part of the moat.

## TODO

- [ ] **Decide scope/appetite** — copilot only, or the full off-chain
      compliance/transfer-agent engine?
- [ ] **Legal review** — is issuing accreditation/approvals a regulated
      function for us? partner vs. build.
- [ ] **Spec the "Document intake" wizard step** — upload term sheet/PPM →
      cited draft deal spec → pre-fills the existing wizard (review-gated,
      nothing auto-submitted). *(First buildable increment.)*
- [ ] Define the **off-chain compliance policy** data model (versioned,
      cited, per-deal) + how it maps to on-chain params and runtime approvals.
- [ ] Design the **accreditation + per-transfer approval issuance** flow
      (the off-chain authority that writes `setAccreditation` / approvals).
- [ ] Investor **onboarding / KYC + accreditation capture** UI.
- [ ] Multi-regime strategy (new compliance contracts vs. off-chain policy).

## Related
- `src/compliance/RealEstateComplianceChecker.sol` (contracts repo) — the
  fixed-regime enforcer this note is grounded in.
- `docs/platform-contracts.md` · `docs/kyb-verification-provider.md`
- Wizard compliance step: `src/app/workspace/assets/new/_components/step-compliance.tsx`
