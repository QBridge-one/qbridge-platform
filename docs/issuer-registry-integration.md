# IssuerRegistry — off-chain KYB vs on-chain registration

How **Clerk KYB** (off-chain) and **IssuerRegistry** (on-chain) fit together. Follows the same split as team **app roles** vs **chain roles** (`TeamMemberSheet.tsx`) and the three-layer model in `Docs/IDENTITY.md`.

---

## Two truths

| Layer | Source of truth | Canonical for… |
|-------|-------------------|----------------|
| **Off-chain KYB** | Clerk org `publicMetadata` (`kybStatus`, `kybApplication`, `kybReview`) | Dashboard access, ops review queue, notifications |
| **On-chain registry** | `IssuerRegistry` proxy on Sepolia (etc.) | `isApproved(wallet)` — token deployment gate |

Off-chain approval **does not** register the issuer on-chain. Chain registration is a **separate client-signed transaction** via `transactionService` (same pipeline as AccessManager `grantRole`).

---

## Flow (ops issuer review)

1. **Approve KYB (off-chain)** — `POST /api/ops/issuers/:orgId/kyb/decision` → `decideIssuerKyb` → Clerk `kybStatus: "approved"`.
2. **Register on-chain (optional, separate step)** — ops reviewer connects wallet → `registerIssuer(wallet, entityId, kybDocumentHash)` on the proxy.

Reject stays off-chain only (no chain tx unless the issuer was already registered — future `revokeIssuer`).

---

## Payload conventions (`src/lib/contracts/issuer-registry-payload.ts`)

All values for `registerIssuer` are derived deterministically so ops UI, tests, and future automation agree.

### `entityId` (`bytes32`)

```text
entityId = keccak256(utf8Bytes(clerkOrgId))
```

- **Input:** Clerk organization id (e.g. `org_2xK9…`), same as `AppOrg.id`.
- **Stable:** same org always maps to the same `entityId` (re-register after revoke uses the same entity).
- **`AppOrg.issuerId`:** optional Clerk metadata field for human/debug display — may store the hex `entityId` after registration, but **derivation always uses `orgId`**, never read back from metadata for encoding.

### `kybDocumentHash` (`bytes32`)

```text
kybDocumentHash = keccak256(utf8Bytes(JSON.stringify(canonicalSnapshot)))
```

Canonical snapshot (fixed key order, empty strings for null optional fields):

| Field | Source |
|-------|--------|
| `legalEntityName` | `IssuerKybApplication.legalEntityName` |
| `jurisdiction` | `IssuerKybApplication.jurisdiction` |
| `companyWebsite` | `companyWebsite ?? ""` |
| `notes` | `notes ?? ""` |
| `submittedAt` | ISO timestamp from submission |

A resubmitted application with different fields produces a **new** hash.

**Today:** hash is derived from the Clerk KYB form snapshot (step 1 “Application”). **Future (Sumsub):** replace or extend the canonical payload with Sumsub’s verified applicant bundle / report id so on-chain registration attests to the regulated KYB outcome, not just the self-reported form.

### `wallet` (`address`)

- The **issuer admin’s** linked wallet: first **active** org member with `issuer_admin` in `appRoles` and non-null `walletAddress` (`primaryWallet` from SIWE link).
- **Not** the ops reviewer’s wallet — ops signs the tx; issuer wallet is the `registerIssuer` argument.

---

## Who signs

| Action | Signer | Contract check |
|--------|--------|----------------|
| `registerIssuer` | Ops reviewer (connected Web3Auth wallet) | `PlatformAccessManager` on registry `authority` |
| `suspendIssuer` / `revokeIssuer` / … | Same pattern | Access-managed |

---

## Code map

| Piece | Path |
|-------|------|
| Payload helpers | `src/lib/contracts/issuer-registry-payload.ts` |
| Registration context API | `GET /api/ops/issuers/:orgId/registration-context` |
| Client hook | `src/lib/hooks/useIssuerRegistrationContext.ts` |
| Generated write hook | `src/lib/generated/issuer-registry/hooks/useRegisterIssuer.ts` |
| Tx orchestration | `src/lib/services/transaction.service.ts` |
| Ops review UI | `src/components/ops/IssuerReviewQueue.tsx` + `IssuerRegistryOnChainSection.tsx` |
| KYB service | `src/lib/services/onboarding.service.ts` |
| Contract address | `src/lib/contracts/registry.ts` → `issuerRegistry` |

### Registration context response

Returned when ops opens an issuer in the review drawer. `registerIssuer` is non-null only when KYB is approved, a KYB snapshot exists, and the issuer admin has a linked wallet.

```json
{
  "orgId": "org_…",
  "kybStatus": "approved",
  "entityId": "0x…",
  "kybDocumentHash": "0x…",
  "issuerAdmin": {
    "userId": "user_…",
    "email": "admin@issuer.com",
    "displayName": "Jane Doe",
    "walletAddress": "0x…"
  },
  "registerIssuer": {
    "wallet": "0x…",
    "entityId": "0x…",
    "kybDocumentHash": "0x…"
  },
  "registrationBlockers": []
}
```

---

## Related docs

- `docs/notifications-and-email.md` §4.2 — off-chain KYB approve/reject
- `docs/database-and-chain-roles.md` — two-truth pattern for AccessManager
- `Docs/IDENTITY.md` — three layers (identity / off-chain RBAC / on-chain RBAC)
- `src/contracts/README.md` — ABI + `yarn generate`
