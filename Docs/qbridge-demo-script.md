# QBridge — Deloitte Demo Script & Narration

**Role framing:** Digital Assets Architect (SME) — Tokenized Deposits / Stablecoins / Ethereum.
**Your posture the whole time:** You are not pitching a product. You are walking an *architecture*
you built, and reasoning out loud like the SME who would design the bank's version.

**Total run time: 8–10 min.** 3 min narrative → 4 min live flow → 2 min Q&A setup.
If time is tight, the live flow (Act 2) is the part to compress, not the framing.

---

## Before you start (setup checklist)

- [ ] Have the **architecture brief** open in one tab (the leave-behind). This is your map.
- [ ] Have the **running app** in another tab, already logged in, on the issuer workspace.
- [ ] Pre-navigate to the **stablecoins** list so you don't fumble auth live.
- [ ] Know your one-liner: *"One platform, many asset classes — deposits and stablecoins on the
      same rail, the difference is policy not plumbing."* Say it early, say it again at the end.
- [ ] Decide up front: you are **screen-sharing a guided flow**, not handing over the keyboard.

---

## ACT 1 — Framing (≈3 min, on the architecture brief, NOT the app)

Open on the brief. Don't touch the app yet. This is where you win the "SME" judgment.

**Beat 1 — the thesis (30s).**
> "Before I show you anything running — the reason a platform like this exists. A bank piloting
> digital cash never stops at one instrument. Tokenized deposits, a regulated stablecoin, tokenized
> collateral — they all need the same four things: verified issuer identity, custody and key
> management, an on-chain permission gate, and reconciliation back to core banking. What differs
> between them is compliance policy and settlement, not the rails. So the architecture is: one shared
> trust spine, a separate contract cluster per asset class."

**Beat 2 — the distinction that proves you're an SME (60s). Point at the table.**
> "The mandate lists tokenized deposits *and* stablecoins separately, and that's deliberate. A
> stablecoin is a bearer token backed by segregated reserves — off the issuer's balance sheet,
> freely transferable, Circle's model. A tokenized deposit is commercial bank money — a deposit
> liability *on* the bank's balance sheet, that only moves between KYC'd, whitelisted account holders,
> and every transfer has to reconcile to the core ledger. Same token standard, completely different
> control and settlement model. In this platform that difference collapses to a single field —
> a transfer policy of allowlist versus blocklist — with issuance and redemption KYC-gated either way."

*(This 60 seconds is the single highest-leverage thing you say. Rehearse it cold.)*

**Beat 3 — the reference point (30s). Point at the topology + Kinexys callout.**
> "The industry reference is JPMorgan's Kinexys — JPMD as a deposit token for 24/7 wholesale
> settlement, plus tokenized collateral and intraday repo. I'm not claiming to have rebuilt Kinexys.
> What I built is the *reusable architecture* a bank adopts once and extends many times — so deposits
> and a stablecoin run on one rail instead of two stovepiped stacks."

**Beat 4 — hand-off to the demo (20s).**
> "Let me show you that this is working software, not a slide. I'll walk the stablecoin cluster,
> because it's live end to end — and then show you that a deposit token is the *same platform*,
> one new product declaration."

---

## ACT 2 — Live flow (≈4 min, on the app)

**Rule: narrate in bank language, not dApp language.** Say "corporate treasury client," "bank ops,"
"deposit claim," "settlement," "permissioned transfer" — never "user," "dapp," "gas," "MetaMask."

### Step 1 — The two planes (30s)
Show the ops plane briefly, then the issuer workspace.
> "Two planes, same as a bank runs internally. The operator plane — bank ops — reviews issuer KYB
> and registers issuers on-chain. The client plane is the corporate treasury workspace, scoped to
> only the products that issuer is entitled to. Same separation of duties, both settling to the same
> contracts."

### Step 2 — Custody, said correctly (30s)
Point at the connected wallet / account.
> "Custody: every user gets an embedded MPC wallet provisioned from their session — no seed phrases,
> no browser extension. And critically, the wallet-to-user binding is canonical in *our* Postgres,
> written server-side from a verified identity token — not in the identity provider. That's the
> system-of-record a bank's risk team asks about first."

### Step 3 — The stablecoin list & the product seam (45s)
Show the stablecoins list; it's filtered from the TokenRegistry by category.
> "This list isn't a separate database — it's the shared TokenRegistry, filtered by category hash.
> Every token self-tags with its asset class when it's minted, so one query spans every product and
> classifies each token back to its cluster. That's the seam that lets deposits and stablecoins
> coexist without forking anything."

### Step 4 — Create / manage flow (90s) — pick ONE, don't do both
**Option A (safer): open the Manage panel on an existing instance.**
> "Here's the compliance surface on a live instance. Proof-of-reserve on one tab. On the Identity
> tab — this is the control plane a bank cares about: the transfer policy. Allowlist means
> permissioned — only verified, jurisdiction-approved holders can receive. That single switch is
> what turns a stablecoin-style token into a deposit-token-style permissioned instrument. Freeze and
> block are separate levers — one at the token, one at the identity registry — so sanctions handling
> and operational freezes don't collide."

**Option B (bolder, only if the deploy works reliably): the create wizard.**
> "Issuance is a four-step wizard — token, reserves, governance, review — and the deploy goes through
> the same transaction service and MPC signer every write uses. Notice the pre-sign confirmation:
> nothing hits chain without an explicit, auditable approval."

### Step 5 — The permission gate (30s)
Show the ops permissions page (AccessManager wiring) if available.
> "And the real authority is here — the on-chain AccessManager. Off-chain roles gate the UI, but they
> never grant on-chain power; the contract is the gate. We wire contract-function-to-role right here
> with setTargetFunctionRole. For a bank, that's the difference between 'the app says no' and 'the
> chain enforces no.'"

---

## ACT 3 — Close & the deposit-token delta (≈1–2 min)

Back to the brief, on the "built today vs. pilot delta" section.

> "So what's real: the platform spine, the stablecoin cluster, KYB onboarding, MPC custody, the
> on-chain permission gate, and the allowlist transfer policy — all working. A tokenized-deposit
> pilot is a *defined delta* on top, not a rebuild: the issuer is a chartered bank, the transfer
> policy defaults to allowlist, and we add a settlement adapter that binds on-chain mint and
> redeem atomically to the core ledger — a two-phase commit across the two ledgers. It's a new
> cluster on the same spine, registered with one product declaration."

**Your closing line (say it with conviction):**
> "That's the thing I'd bring to this role — not a single product, but the architecture that lets a
> bank stand up deposits and a stablecoin on one platform, with identity, custody, compliance, and
> settlement as swappable seams. That's what makes it adoptable, and auditable, in a regulated
> environment."

---

## What NOT to do (failure modes)

- ❌ Don't hand them the keyboard or give raw multi-tenant access. Guided flow only.
- ❌ Don't click into half-built surfaces (real estate deep flows, anything you haven't rehearsed).
- ❌ Don't say "user," "gas," "dapp," "crypto," "wallet extension." Bank vocabulary only.
- ❌ Don't call the core-ledger↔token binding "DvP." That's the #1 credibility trap. DvP =
      cash-versus-*security*. Binding a deposit mint to a core posting is an **atomic two-phase
      commit / cross-ledger settlement**. Only use "DvP" for the cash leg of a tokenized security/repo.
- ❌ Don't overclaim. If they ask "is the deposit token live?" — say plainly: *"The cluster is
      scaffolded and registered as a product; the stablecoin cluster is what's live end to end.
      The deposit delta is settlement reconciliation and the bank-issuer model — that's the pilot."*
- ❌ Don't get pulled into a Solidity line-by-line unless they ask. Stay at architecture altitude —
      that's what the *SME architect* seat is.
- ❌ Don't badmouth Kinexys/JPM or competitors. Reference them as the proof the pattern works.

---

## Anticipated questions — have a crisp answer ready

**"Public chain or permissioned?"**
> "Both are viable and it's a policy choice, not an architecture one. JPM put JPMD on a public chain
> *with* permissioning. My design keeps the permission gate at the token and identity registry, so the
> same contracts run on a permissioned network or a public one — the allowlist enforces who can hold."

**"How does it settle with core banking?"**
> "Through a settlement adapter behind a port. On-chain mint/redeem is the instruction; the adapter
> binds it atomically to a core-ledger posting — a two-phase commit across the two ledgers, so the
> token supply can never diverge from the deposit balance. (I'd reserve the term DvP for when this
> token settles the cash leg of a tokenized security or repo — that's the cash-versus-security case.)
> For a stablecoin it's reserve attestation instead. The domain never talks to the core directly —
> that's the hexagonal boundary."

**"Key management / custody model?"**
> "MPC signing today, one wallet per user, session-authenticated. The wallet port is 4337-ready, so a
> smart-account / HSM-backed custody model is an adapter swap, not a rewrite. The binding of wallet to
> legal user is canonical in our database, which is what an auditor traces."

**"How do you handle sanctions / a bad actor?"**
> "Two independent levers: block at the identity registry (they can't receive), and freeze at the
> token (their balance can't move). Separate on purpose so a compliance freeze and a sanctions block
> don't interfere, and both are on-chain-enforced, not just UI."

**"Token standards?"**
> "ERC-20 as the base for fungible cash, with ERC-1400-style controlled transfer for the permissioned
> cases — that's exactly the allowlist policy. ERC-721/1400 for the security-token side, like the
> real-estate cluster. The point is the standard is per-cluster; the platform doesn't assume one."

**"What would a real bank engagement's first 90 days look like?"** *(they may probe leadership)*
> "Target operating model and regulatory posture first — OSFI framing, who's the issuer of record.
> Then the settlement integration to core banking, because that's the hardest seam and it de-risks
> everything downstream. Contracts and the token are the *least* risky part; the integration and the
> controls are where the architecture earns its keep."
