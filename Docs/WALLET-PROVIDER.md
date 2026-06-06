# QBridge — Wallet Provider Architecture

This document explains the current wallet stack (**Privy**), how it is kept
separate from the identity layer (**Clerk**), how a user's wallet is bound to
their account (**Postgres**, server-side, no signature), and what would change
to swap Privy for another provider later.

> History: QBridge originally used **Web3Auth** as the embedded-wallet provider
> with a client-side SIWE flow that wrote the wallet into Clerk
> `publicMetadata`. That has been fully removed in favour of Privy + a
> Postgres-backed binding. If you are reading old commits/comments that mention
> Web3Auth or `/api/wallet/{nonce,link}`, this doc is the current truth.

## Mental model

QBridge has two independent layers. Treat them as completely separate concerns:

| Layer    | Source of truth                | What it answers                                |
| -------- | ------------------------------ | ---------------------------------------------- |
| Identity | Clerk (`IdentityPort`)         | Who is the user? What organization? What role? |
| Wallet   | Privy via `WalletPort` adapter | Which key signs? What address? Send a tx.      |

The user has **one Clerk account** across the platform. **Clerk is the only
login.** The wallet is an embedded, per-user concern that Privy provisions and
binds to the Clerk identity automatically — it is never a second login.

## How a user gets a wallet (the flow)

1. **User signs in with Clerk** (`/sign-in`). No wallet UI, no Privy modal.
2. **Privy authenticates from the Clerk session JWT** ("custom" / JWT-based
   auth). Privy verifies the Clerk token and, for that user, provisions one
   **embedded MPC wallet** (`createOnLogin: "users-without-wallets"`).
   No second login screen.
3. **The wallet surfaces as a wagmi connector** (`@privy-io/wagmi`), so the
   rest of the app reads `address` / `chainId` and signs through wagmi exactly
   as before. `<PrivyWalletStateSync>` promotes the embedded wallet to wagmi's
   active account.
4. **The wallet is auto-bound to the user.** `<PrivyAutoBind>` posts the Privy
   **identity token** to `POST /api/wallet/bind`; the server verifies it and
   records the address (see next section). No user signature, no popup.
5. **Signing is silent.** `embeddedWallets.showWalletUIs: false` — QBridge owns
   the transaction-confirmation UX; Privy does not pop its own dialogs.

The dashboard `WalletStatus` component is therefore **display-only**: a brief
"Loading wallet…" then the address with a "Linked" indicator.

## The wallet ↔ user binding (system of record)

The canonical "which wallet belongs to which user" record lives in **our
Postgres** (`wallet_bindings` table) — **not** in Clerk `publicMetadata`, and
**not** via a client-signed SIWE message.

How a binding is established (authoritative, server-side):

1. Client has the Privy **identity token** (`useIdentityToken()` /
   `privy-id-token` cookie) — a Privy-signed JWT containing the user's linked
   accounts (including the embedded wallet address).
2. `<PrivyAutoBind>` posts it to `POST /api/wallet/bind`.
3. The route is authenticated as a Clerk user (`requireSession()`), and the
   wallet address comes from the **verified** token, not a client claim:
   `@privy-io/server-auth` `PrivyClient.getUser({ idToken })` verifies the
   signature and parses linked accounts locally (no API call).
4. The address is written to `wallet_bindings` via `WalletBindingPort.upsert`,
   and an `wallet.linked` audit entry is appended.

**Trust chain:** Clerk session proves *who*; the Privy-signed identity token
proves *which wallet*. Neither is a client-supplied claim. Because Privy
already provisioned the wallet for this Clerk user, no SIWE proof is needed.

### How `primaryWallet` is read

`IdentityPort.getSession()` / `getUser()` and `OrganizationPort.listMembers()`
resolve `primaryWallet` / `walletAddress` from the **binding store first**,
falling back to Clerk `publicMetadata` only as a transitional/legacy path. The
identity reads are wrapped so a binding-store outage degrades gracefully rather
than breaking auth. Everything downstream (on-chain issuer registration, role
grants, team views) reads these unchanged.

## Architecture: ports & adapters

| Port                | File                                       | What it abstracts                    |
| ------------------- | ------------------------------------------ | ------------------------------------ |
| `IdentityPort`      | `src/lib/ports/identity.port.ts`           | Current user, active org             |
| `OrganizationPort`  | `src/lib/ports/organization.port.ts`       | Members, invites                     |
| `WalletPort`        | `src/lib/ports/wallet.port.ts`             | Connect, sign, sendTx                |
| `WalletBindingPort` | `src/lib/ports/wallet-binding.port.ts`     | Canonical user → wallet record (DB)  |

Active provider is selected by env (defaults to `privy`):

```
IDENTITY_PROVIDER           = memory | clerk          # server (.env)
NEXT_PUBLIC_WALLET_PROVIDER = privy                   # client + server
```

Wired in:

- `src/lib/container.server.ts` — server-only (identity, org, wallet-binding, …)
- `src/lib/container.ts`        — client-safe (wallet, blockchain, services)

The single client-side wallet hook every component uses is:

```ts
// src/lib/hooks/useWallet.ts
export const useWallet: () => UseWalletReturn = isPrivyConfigured
  ? useWalletPrivy
  : useWalletStub;
```

This is the **only** file in the app that imports `@privy-io/react-auth`
hooks. When you swap providers, this is the only client-side hook file you
change.

## Files involved in the wallet boundary

| Concern                          | File                                                       |
| -------------------------------- | ---------------------------------------------------------- |
| Wallet adapter (`WalletPort`)    | `src/lib/adapters/wallet/privy.adapter.ts`                 |
| Privy static config              | `src/config/privy.ts`                                      |
| Privy wagmi config               | `src/lib/privy-wagmi-config.ts`                            |
| Provider tree (client)           | `src/components/providers/privy-providers.tsx`             |
| Wagmi state → adapter + active   | `src/components/providers/privy-wallet-state-sync.tsx`     |
| Auto-bind on login               | `src/components/providers/privy-auto-bind.tsx`             |
| Auto-disconnect on Clerk logout  | `src/components/providers/wallet-auto-disconnect.tsx`      |
| Provider mount point             | `src/components/providers/wallet-providers.tsx`            |
| Domain-level hook                | `src/lib/hooks/useWallet.ts`                               |
| Bind hook (posts identity token) | `src/lib/hooks/useWalletBind.ts`                           |
| Binding port                     | `src/lib/ports/wallet-binding.port.ts`                     |
| Binding adapters (drizzle/memory)| `src/lib/adapters/wallet-binding/`                         |
| Identity-token verifier (server) | `src/lib/adapters/wallet-binding/privy-identity.ts`        |
| Dashboard wallet UI              | `src/components/wallet/wallet-status.tsx`                  |
| API: bind                        | `src/app/api/wallet/bind/route.ts`                         |
| DB table + migration             | `wallet_bindings` in `src/lib/db/schema.ts` (mig. `0003`)  |

## Provider tree

```
PrivyProvider (config from src/config/privy.ts; customAuth → Clerk getToken)
└─ QueryClientProvider
   └─ WagmiProvider (config from @privy-io/wagmi)
      ├─ <PrivyWalletStateSync/>   inject wagmi config + set active wallet
      ├─ <PrivyAutoBind/>          post identity token → /api/wallet/bind
      └─ <WalletAutoDisconnect/>   Privy logout on Clerk sign-out
```

`createConfig` and `WagmiProvider` **must** come from `@privy-io/wagmi` (not
`wagmi` directly) — the wrapper sets `reconnectOnMount: false`, required for
the embedded wallet to surface as a connector.

## Key-custody note

Privy embedded wallets are **MPC** — the key is split across parties, so no
single party (or single compromise) exposes the full key. Prefer MPC or
HSM-backed signers (Turnkey) over TEE-only custody. For QBridge's institutional
posture, MPC is an acceptable default.

## Dependency & runtime notes

These exist because of Privy's dependency tree and are **not** Web3Auth
leftovers — keep them:

- **`engines.node >= 20.19.0`** (`.nvmrc` = `22`). Privy's crypto deps require
  it; lower Node fails to install/run.
- **`@wagmi/core` pinned to `3.4.0`** as a direct dependency — matches
  `wagmi@3.5.0`'s core and keeps a single top-level version (Privy's nested
  tree otherwise hoists a conflicting `@wagmi/core@2.x`).
- **`resolutions.viem = "2.52.0"`** — Privy peers an exact viem; this dedupes
  the 4+ copies Privy's tree would otherwise pull. Verified: 0 nested viem
  copies.

`src/lib/wagmi-config.ts` is **kept** (separate from the Privy connector
config): it's the `@wagmi/core` singleton used by server-side imperative reads
(compliance preflight, viem adapter). It is not the wallet connector.

## Deploy checklist

In your hosting env (Vercel) and the indexer worker env:

```env
NEXT_PUBLIC_WALLET_PROVIDER=privy
NEXT_PUBLIC_PRIVY_APP_ID=...        # public
PRIVY_APP_SECRET=privy_...          # SERVER-ONLY, never NEXT_PUBLIC
# optional: NEXT_PUBLIC_PRIVY_NETWORK=mainnet   # else Sepolia
```

Privy dashboard:

- **User management → Authentication → JWT-based auth**: add your Clerk JWKS URL
  (`https://<clerk-frontend-api>/.well-known/jwks.json`), ID claim `sub`, `aud`
  empty, Client-side enabled.
- **User management → Authentication → Advanced**: enable **"Return user data in
  an identity token"** (otherwise `useIdentityToken()` is null and binding
  never fires).

Database: apply migration `0003` (`wallet_bindings`) to the production DB —
migrations are **not** auto-run on deploy (`build` is just `next build`):

```
DATABASE_URL="<prod-url>" yarn db:migrate
```

## Replaceability: swapping Privy later

The port boundary makes a future swap a config + adapter change, not a refactor.

1. Implement the new adapter under `src/lib/adapters/wallet/` (`WalletPort`).
   An `alchemy.adapter.ts` stub exists for ERC-4337 smart accounts.
2. Add a branch in `src/lib/hooks/useWallet.ts` and `pickWalletAdapter()` in
   `src/lib/container.ts`, gated on `NEXT_PUBLIC_WALLET_PROVIDER`.
3. Mount the provider's React tree in `src/components/providers/` and select it
   in `wallet-providers.tsx`.
4. The binding mechanism is provider-specific: Privy uses a verified identity
   token. A different provider would supply its own authoritative source (its
   own token, a webhook, or a backend lookup) feeding `WalletBindingPort`.

What never changes: `IdentityPort` (Clerk), the `UseWalletReturn` shape, the
`/api/team/**` and on-chain RBAC flows, and how `primaryWallet` is consumed.

## TL;DR

Privy is the **wallet** today; Clerk is the **identity** today and forever. The
wallet auto-provisions on Clerk login (no second login, no signature), and the
user → wallet binding is recorded in **our Postgres** from a verified Privy
identity token. To swap providers, change the env + drop in a `WalletPort`
adapter + a provider tree; nothing else needs to know.
