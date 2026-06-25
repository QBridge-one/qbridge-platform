# Stablecoin product — platform integration

How the **payment-stablecoin** asset class is integrated into the QBridge
platform app: the multi-product architecture it introduced, the contract wiring,
the UI surfaces, and the one-time on-chain setup needed to deploy one.

This is the **platform/app** counterpart to the contracts-side
[`qbridge-smart-contracts/docs/stablecoin-overview.md`](../../qbridge-smart-contracts/docs/stablecoin-overview.md)
(read that for the on-chain design: proof-of-reserves gating, redemption queue,
the per-stablecoin contract cluster).

---

## 1. What it is

A fiat-backed, non-custodial, **proof-of-reserves-gated** payment stablecoin,
added as a **second asset class** alongside real-estate tokenization. It reuses
the shared platform infrastructure (identity, wallet, IssuerRegistry,
TokenRegistry, AccessManager) and shares **no business logic** with the
real-estate product.

It ships **dark** behind a feature flag (`NEXT_PUBLIC_PRODUCT_STABLECOIN`,
default `false`).

---

## 2. Architecture — one platform, multiple products

The app mirrors the on-chain split: **shared platform singletons** + a
**separate factory/token/compliance cluster per asset class**.

```
Shared spine (one of each, all products):
  Clerk login · Privy wallet · IssuerRegistry (KYB) · TokenRegistry (catalog)
  · PlatformAccessManager · PlatformTimelock

Per product (one cluster type each):
  real-estate  →  SingleSpvRealEstateFactory  →  token + NAV oracle + distribution + capital-call + …
  stablecoin   →  StablecoinFactory           →  token + ReserveOracle + compliance + access manager + timelock
```

### The product registry — `src/lib/products/`

The single place that declares which asset classes exist. Each `ProductDefinition`
carries metadata + the on-chain discriminator (`categoryHash = keccak256(category)`)
+ wiring keys. **No business logic** — product-specific logic lives behind
hooks/services keyed by product, like every other adapter in the hexagon.

- `TokenRegistry` self-tags every token with `(category, assetType)`, so one
  `tokensByIssuer(X)` spans **all** products. `productByCategoryHash()` classifies
  a token into its product.
- Adding/enabling a product happens **only** here (the way concrete adapters are
  wired only in `container.ts`).

### Factory rename (breaking-ish, internal)

"The factory" became product-keyed:

| Before | After |
|---|---|
| codegen `factory` / `src/lib/generated/factory` | `real-estate-factory` / `src/lib/generated/real-estate-factory` |
| address key `factory` | `realEstateFactory` (+ new `stablecoinFactory`) |
| `getFactoryAddress` / `useFactoryAddress` | `getRealEstateFactoryAddress` / `useRealEstateFactoryAddress` |
| env `NEXT_PUBLIC_FACTORY_*` | `NEXT_PUBLIC_REAL_ESTATE_FACTORY_*` (old name still read as a fallback) |

---

## 3. Contract integration

Three contracts were integrated via the standard codegen pipeline
(`src/contracts/<key>/abi.json` + `manifest.json` → `yarn generate` →
`src/lib/generated/<key>/`):

| Feature key | Contract | Address key |
|---|---|---|
| `stablecoin-factory` | `StablecoinFactory` | `stablecoinFactory` (singleton) |
| `stablecoin-token` | `StablecoinToken` | `stablecoinToken` (per-instance; registry holds a reference instance) |
| `reserve-oracle` | `ReserveOracle` | `reserveOracle` (per-instance; ditto) |

### Hand-encoded `createStablecoin`

`createStablecoin` takes a **nested tuple**, which codegen deliberately skips (it
"would produce a useless form"). So, exactly like `createDeal`, it's hand-wired:

- `src/lib/contracts/create-stablecoin-abi.ts` — the function fragment + the
  **union of every stablecoin error** (factory/token/oracle/compliance/identity),
  so a deploy revert decodes to a named error instead of a raw selector.
- `src/lib/contracts/stablecoin-payload.ts` — `buildStablecoinConfig(values)` →
  the tuple.
- `src/types/stablecoin.ts` — the typed `StablecoinConfig`.
- `src/lib/hooks/useCreateStablecoin.ts` — the write hook (same
  `transactionService` path as generated hooks).

### Per-instance writes — `useStablecoinAdmin.ts`

The **generated** forms/hooks resolve their address only from the registry
(singleton fallback). A stablecoin token is **per-instance**, so the detail page
operates the specific token being viewed via `useStablecoinAdmin.ts` — an
address-parametrized runner over `transactionService` + ABI constants (so reverts
still decode). It uses the **generated** ABIs for token/oracle, and a hand
fragment `src/lib/contracts/stablecoin-compliance-abi.ts` for the
`IdentityRegistry` + `StablecoinComplianceChecker` functions (those two aren't
codegen feature-keys).

---

## 4. UI surfaces

### Issuer workspace (`/workspace`)
- `stablecoins/` — list of the issuer's stablecoins (filtered from TokenRegistry
  by `categoryHash`) + the reference/demo instance card.
- `stablecoins/[token]/` — read-only **proof-of-reserves** view (attested
  reserves / supply / mintable headroom / coverage / staleness) **+ a Manage
  panel** with tabs:
  - **Reserves** — `attestReserves`.
  - **Issue** — `issue` (reserve-gated mint).
  - **Redeem** — `fulfillRedemption` / `cancelRedemption`.
  - **Identity** — transfer policy (`setTransferPolicy` Allowlist/Blocklist) +
    holder allowlist/sanctions (`setIdentity` verify+jurisdiction, `setBlocked`)
    with a live verified/jurisdiction/blocked status lookup.
  - **Freeze** — token-level `freeze` / `unfreeze` (distinct from registry-level
    Block on the Identity tab).
- `stablecoins/new/` — the **create wizard** (Token → Reserves → Governance →
  Review & deploy → `createStablecoin`). The Token step includes the required
  **transfer policy** choice (`complianceParams.transferPolicy`).

### Ops (`/ops`)
- `admin/factory` — `StablecoinFactoryStatusPanel` beside the real-estate one
  (status, implementation templates, pause/unpause).
- `admin/permissions` — **Stablecoin Factory** added as a permissions target
  (incl. `createStablecoin`, merged back from the hand fragment). Per-instance
  token/oracle roles are **not** here — they live on each instance's own
  `TokenAccessManager`.

### Product-aware nav
Sidebar items can declare a `product?`; they render only when
`getProduct(p).enabled`. Flag off ⇒ the workspace looks unchanged.

---

## 5. Proof-of-reserves: deploy ≠ issue

**Creating a stablecoin does not require reserves; minting does.** The
`ReserveOracle` is born empty, so the token deploys fine but every `issue`/`mint`
reverts (`ReservesInsufficient`) until reserves are attested. The PoR guarantee —
"no proven reserves ⇒ no tokens" — is enforced at mint time, not deploy time.

Flow: **attest reserves** (Reserves tab) → `mintableHeadroom` opens → **issue**
up to the attested amount.

### Transfer policy & holder compliance

There is **no on-chain list of sanctioned countries** — the country/jurisdiction
decision is made off-chain (KYC) and recorded **per holder** on the instance's
`IdentityRegistry`. Two layers, both managed from the **Identity tab**:

- **TransferPolicy** (`complianceParams.transferPolicy`, set at create or via
  `setTransferPolicy`): `0 Allowlist` — both parties must be KYC-verified +
  jurisdiction-approved (permissioned); `1 Blocklist` — open circulation, only
  blocked addresses rejected (USDC/USDT model). Governs **P2P transfers only**.
- **Per-holder flags:** `setIdentity(verified, jurisdictionApproved)` (allowlist)
  and `setBlocked` (sanctions). **Issuance and redemption are KYC-gated under
  every policy** — so a recipient must be verified before `issue` succeeds,
  regardless of TransferPolicy.

`freeze` (token level, Freeze tab) is distinct from `setBlocked` (registry level):
freeze halts one holder immediately on the token; block marks the identity
sanctioned across the whole cluster's compliance checks.

---

## 6. One-time on-chain setup (required before issuers can deploy)

`createStablecoin` is gated by the **PlatformAccessManager**. Unconfigured
functions default to admin-only, so an issuer call reverts
`AccessManagedUnauthorized` until the role is opened — identical to how
`createDeal` was set to `PUBLIC_ROLE` at launch.

1. Connect the **super-admin** wallet (holds role 0 on the PlatformAccessManager;
   `setTargetFunctionRole` is super-admin-only).
2. `/ops/admin/permissions` → target **Stablecoin Factory** → function
   **createStablecoin** → set required role to **Public**.
3. Approved issuers can now deploy; the **IssuerRegistry** approval check inside
   `createStablecoin` is the real gate.

### Operational gotchas
- **Separation of duties:** `RESERVE_ATTESTER` must differ from `MINTER` (the
  point of PoR). Attesting and issuing from the same wallet can revert.
- **Staleness:** if the latest attestation ages past `maxReserveAttestationAge`,
  issuance halts (transfers/redemptions stay live) until re-attestation.
- **Roles per instance:** `issue` (MINTER), `attestReserves` (RESERVE_ATTESTER),
  redemption (REDEEMER), freeze/forceBurn are restricted on the instance's
  `TokenAccessManager`.

---

## 7. Configuration

```bash
# Enable the product (ships dark by default). NEXT_PUBLIC_* is baked at
# dev-server start — restart after editing.
NEXT_PUBLIC_PRODUCT_STABLECOIN=true

# Factory singleton (Sepolia)
NEXT_PUBLIC_STABLECOIN_FACTORY_SEPOLIA=0x2a757c5536ed72b63eef1ab23e3aaa79d8d35ff7

# Reference/demo instance (Acme USD V2, Blocklist) — fallback address for the
# stablecoin-token / reserve-oracle read hooks when none is passed explicitly.
NEXT_PUBLIC_STABLECOIN_REF_TOKEN_SEPOLIA=0x8438F90e1192bDb38a5c79ED0A40A8bDDb189845
NEXT_PUBLIC_STABLECOIN_REF_ORACLE_SEPOLIA=0x1f40C330415b2187DBD84a73bc3CD8CB8600a35a
```

See `src/lib/contracts/registry.ts` and `.env.example` for the full per-chain set.

---

## 8. File map

```
src/lib/products/                         product registry (the seam)
src/contracts/{stablecoin-factory,stablecoin-token,reserve-oracle}/   ABIs + manifests
src/lib/generated/{stablecoin-factory,stablecoin-token,reserve-oracle}/   codegen output
src/lib/contracts/create-stablecoin-abi.ts   hand fragment (nested tuple)
src/lib/contracts/stablecoin-compliance-abi.ts  hand fragment (IdentityRegistry + ComplianceChecker)
src/lib/contracts/stablecoin-payload.ts      form values → StablecoinConfig
src/types/stablecoin.ts                      StablecoinConfig + labels + TransferPolicy
src/lib/validators/stablecoin-wizard.ts      wizard zod schema
src/lib/hooks/useCreateStablecoin.ts         deploy write hook
src/lib/hooks/useStablecoinSummary.ts        read-only PoR snapshot (+ compliance/identity addrs)
src/lib/hooks/useStablecoinAdmin.ts          per-instance write runner
src/app/workspace/stablecoins/**             issuer UI (list / detail+Manage / new)
src/components/ops/StablecoinFactoryStatusPanel.tsx   ops factory panel
```

---

## 9. Not yet done

- Product choice at sign-up / onboarding (which product is the issuer here for).
- Branch the dashboard "New" action (real-estate vs stablecoin).
- Marketing/landing separation per product.
- Yield-bearing stablecoin / tokenized treasury (a **security** — a separate
  module, not an extension of this one).
