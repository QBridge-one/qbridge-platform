# IssuerRegistry — lifecycle actions & status (implementation status)

What's **built**, **parked**, and **remaining** for the IssuerRegistry **write
surface** (the ops actions that change an issuer's on-chain state). For the
conceptual off-chain-KYB vs on-chain-registration split and the `registerIssuer`
payload conventions, see [`issuer-registry-integration.md`](./issuer-registry-integration.md).

---

## On-chain status state machine

`getStatus(wallet)` / `getIssuer(wallet).status` returns a `uint8` enum:

| Value | Status | Meaning |
|------:|--------|---------|
| 0 | `None` | never registered |
| 1 | `Active` | registered & approved (`isApproved` true) |
| 2 | `Suspended` | temporarily inactive (`isApproved` false), reversible |
| 3 | `Revoked` | **terminal** — re-entry needs `registerIssuer` with fresh KYB |

```
            registerIssuer
   None ───────────────────▶ Active ──suspend──▶ Suspended
                               │  ▲                  │
                               │  └───reactivate─────┘
                        revoke │                      │ revoke
                               ▼                      ▼
                            Revoked (terminal)
```

> **Drive UI off `status`, not `isApproved`.** A Suspended issuer has
> `isApproved === false` but is still registered. Keying off `isApproved` alone
> mislabels Suspended/Revoked as "not registered". This bit us once — fixed in
> both the issuer panel and the ops queue.

---

## Write surface — what each function is, and its UI

| Function | Args | Status it applies to | Where in the UI | State |
|----------|------|----------------------|------------------|-------|
| `registerIssuer` | `(wallet, entityId, kybDocumentHash)` | None → Active | Issuer panel (`IssuerRegistryOnChainSection`) | ✅ built |
| `suspendIssuer` | `(wallet)` | Active → Suspended | Issuer panel | ✅ built |
| `reactivateIssuer` | `(wallet)` | Suspended → Active | Issuer panel | ✅ built |
| `setDefaultExpirationDuration` | `(newDuration: uint48)` | **global config** | Platform settings (`ops/admin/flags`) | ✅ built |
| `revokeIssuer` | `(wallet)` | Active/Suspended → Revoked | (was issuer panel) | ⏸️ **parked** |
| `migrateWallet` | `(from, to, …)` | per-issuer wallet change | — | ⛔ **not built** |

`defaultExpirationDuration()` (read) backs the settings card. `setDefaultExpirationDuration`
is a **global default *duration* in seconds** applied to **future** registrations
and migrations — it is **not** a per-issuer expiry date and is **not** retroactive.
There is no per-issuer "set expiry" function; an issuer's expiry is computed at
registration as `registeredAt + defaultExpirationDuration`.

---

## UI surfaces

1. **Issuer lifecycle panel** — `src/components/ops/IssuerRegistryOnChainSection.tsx`
   (in the ops issuer review drawer). Reads `getIssuer`/`isApproved`, shows a
   status badge, and renders the action valid for the current status
   (register / suspend / reactivate). Self-contained `TxStatus`,
   `WrongNetworkHint`, and a `runAction` helper.
2. **Ops issuer queue** — `src/components/ops/IssuerReviewQueue.tsx`. The
   "On-chain KYB" column reads live status server-side via
   `batchIssuerRegistryStatus` (`src/lib/contracts/issuer-registry-status.ts`,
   uses `getStatus`) and shows `KYB verified` / `Suspended` / `Revoked` /
   `Not verified` badges.
3. **Platform settings** — `src/components/ops/DefaultExpirationSetting.tsx`
   mounted on `src/app/ops/admin/flags/page.tsx` (gated `ops:flags:edit`).

---

## Conventions every lifecycle action follows

- **Server prepares, client signs.** Action → generated write hook →
  `transactionService.execute` → `POST /api/tx/prepare` (encode + **simulate as
  the caller** + audit) → wallet pre-sign modal → broadcast → wait for receipt.
- **Simulation is a hard gate.** `/api/tx/prepare` simulates with
  `account: caller`; a revert there returns **422** and the tx is never sent —
  so most reverts (incl. unauthorized caller) are caught before signing.
- **Receipt is checked.** `transaction.service` treats a **mined-but-reverted**
  receipt (`status: "failed"`) as an error, not a success. (Etherscan's
  "indexing" is display lag, unrelated to our receipt-based confirmation.)
- **On-chain AccessManager is the real authority.** Off-chain `can(...)` gates
  are UX only; the contract rejects unauthorized signers.
- **Copy comes from the contract manifest** (`src/contracts/issuer-registry/manifest.json`
  → `displayName` / `description`).
- **shadcn + design tokens only** (no hardcoded colors; light/dark safe).

---

## Parked: `revokeIssuer`

The on-chain action + a type-to-confirm dialog were built and then reverted
(commit `f4cc350`). The **on-chain tx works**; the **off-chain side needs
design** before shipping:

1. **KYB reset / Sumsub.** Revoke is terminal and re-entry requires *fresh* KYB.
   Resetting `kybStatus → "none"` re-closes the `registerIssuer` gate (which
   requires `kybStatus === "approved"`) and sends the issuer back to onboarding —
   but the interaction with the **existing Sumsub case** (reuse vs. a brand-new
   inquiry) was not resolved. A for-cause revoke may also warrant flagging the
   applicant in Sumsub (manual today; automatable via their API later).
2. **Issuer dashboard update.** How the issuer's workspace should react to a
   reset (notify them, where they land) needs a deliberate UX. There is no
   `issuer.revoked` / `kyb_reset` notification kind yet.

**Policy already decided:** on revoke, reset KYB (force re-KYB); change on-chain
authority only — **do not** revoke workspace access.

> The generated `useRevokeIssuer` hook still exists (auto-generated from the ABI).
> Re-wiring the UI is small; the **lifecycle/notification semantics above are the
> real work.**

---

## Remaining: `migrateWallet`

Not built. It's the first flow that needs a **typed address input** (the new
wallet), so it's the right moment to build a reusable `AddressField` primitive
(checksum / ENS / validation) rather than a one-off input. Same
`transactionService` + `TxStatus` pattern as the other panel actions.

---

## Code map

| Piece | Path |
|-------|------|
| Issuer lifecycle panel (register/suspend/reactivate) | `src/components/ops/IssuerRegistryOnChainSection.tsx` |
| Default-expiration settings card | `src/components/ops/DefaultExpirationSetting.tsx` |
| Platform settings page | `src/app/ops/admin/flags/page.tsx` |
| Ops queue + status badges | `src/components/ops/IssuerReviewQueue.tsx` |
| Server batch status read (`getStatus`) | `src/lib/contracts/issuer-registry-status.ts` |
| Generated hooks (read + write) | `src/lib/generated/issuer-registry/hooks/` |
| Tx orchestration (simulate / sign / receipt check) | `src/lib/services/transaction.service.ts` |
| Server prepare (encode + simulate) | `src/app/api/tx/prepare/route.ts` |
| Manifest (UI copy, include list) | `src/contracts/issuer-registry/manifest.json` |

---

## Related docs

- [`issuer-registry-integration.md`](./issuer-registry-integration.md) — off-chain KYB vs on-chain registration, payload conventions
- [`kyb-verification-provider.md`](./kyb-verification-provider.md) — Sumsub / Persona KYB
- [`database-and-chain-roles.md`](./database-and-chain-roles.md) — two-truth pattern
- `src/contracts/README.md` — ABI + `yarn generate` (manifest is the source of truth)
