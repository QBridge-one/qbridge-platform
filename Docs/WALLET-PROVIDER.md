# QBridge — Wallet Provider Architecture

This document explains the current wallet stack (Web3Auth), why it is separated
from the identity layer (Clerk), and exactly what to change to swap Web3Auth
for **Turnkey** or **Alchemy Account Kit** later.

## Mental model

QBridge has two independent layers. Treat them as completely separate concerns:

| Layer    | Source of truth        | What it answers                                |
| -------- | ---------------------- | ---------------------------------------------- |
| Identity | Clerk (`IdentityPort`) | Who is the user? What organization? What role? |
| Wallet   | `WalletPort` adapter   | Which key signs? What address? Send a tx.      |

The user has **one Clerk account** across the platform. The wallet is an
in-app, per-user concern that is provisioned and bound to the Clerk identity
via SIWE — not a second login.

## What we did with Web3Auth (the refactor)

Originally the landing-page "Login" button opened the Web3Auth modal, then
redirected to `/workspace`, which then forced a Clerk sign-in. Two auth
screens for one user. Web3Auth was acting as both an auth provider and a
wallet provider, which conflicts with Clerk owning identity.

The refactor enforces a clean split:

1. **Clerk is the only login.** The landing-page CTA points at `/sign-in` /
   `/sign-up` (Clerk) and at `/select-workspace` for signed-in users. There
   is no Web3Auth call on `/`.
2. **Web3Auth is the embedded-wallet provider only.** Inside `/workspace`
   and `/ops`, a `WalletStatus` component lets the user click **Connect
   wallet**, opens the Web3Auth modal, and shows the address in the header.
3. **SIWE binds the wallet to the Clerk user.** After connecting, the user
   can click **Link to account**: `useWalletLink` issues a nonce, the wallet
   signs it, the server verifies via `viem.verifyMessage`, and writes the
   address into Clerk `publicMetadata.primaryWallet`. The binding now
   survives across browsers, devices, and server restarts.
4. **Single sign-out.** `WalletAutoDisconnect` listens for Clerk's
   `useUser().isSignedIn` to flip false and disconnects the embedded wallet
   in the same step. One logout, both states cleared.
5. **Provider switches** in env make the wallet swappable without touching
   feature code (see "Replaceability" below).

## Architecture: ports & adapters

The relevant ports are already defined and adapter-agnostic:

| Port                | File                                    | What it abstracts          |
| ------------------- | --------------------------------------- | -------------------------- |
| `IdentityPort`      | `src/lib/ports/identity.port.ts`        | Current user, active org   |
| `OrganizationPort`  | `src/lib/ports/organization.port.ts`    | Members, invites           |
| `WalletPort`        | `src/lib/ports/wallet.port.ts`          | Connect, sign, sendTx      |
| `WalletLinkPort`    | `src/lib/ports/wallet-link.port.ts`     | SIWE nonce + verify + bind |

Active adapters live behind two env switches:

```
IDENTITY_PROVIDER         = memory | clerk           # server (.env)
NEXT_PUBLIC_WALLET_PROVIDER = web3auth | alchemy | turnkey   # client + server
```

Wired in:

- `src/lib/container.server.ts` — server-only (identity, org, wallet-link, …)
- `src/lib/container.ts`        — client-safe (wallet, blockchain, services)

The single client-side hook every component uses is:

```ts
// src/lib/hooks/useWallet.ts
export const useWallet: () => UseWalletReturn = isWeb3AuthConfigured
  ? useWalletWeb3Auth
  : useWalletStub;
```

This is the **only** file in the app that imports `@web3auth/modal/react`.
When you swap providers, this is the only client-side hook file you change.

## Files involved in the wallet provider boundary

| Concern                   | File                                                       |
| ------------------------- | ---------------------------------------------------------- |
| Wallet adapter (server)   | `src/lib/adapters/wallet/web3auth.adapter.ts`              |
| Wallet adapter (stub AA)  | `src/lib/adapters/wallet/alchemy.adapter.ts`               |
| Provider tree (client)    | `src/components/providers/web3auth-providers.tsx`          |
| State sync into adapter   | `src/components/providers/wallet-state-sync.tsx`           |
| Auto-disconnect on logout | `src/components/providers/wallet-auto-disconnect.tsx`      |
| Domain-level hook         | `src/lib/hooks/useWallet.ts`                               |
| SIWE link hook            | `src/lib/hooks/useWalletLink.ts`                           |
| SIWE link adapter (Clerk) | `src/lib/adapters/wallet-link/clerk.adapter.ts`            |
| Dashboard wallet UI       | `src/components/wallet/wallet-status.tsx`                  |
| API: nonce / link / unlink| `src/app/api/wallet/{nonce,link}/route.ts`                 |

## Replaceability: swap path

Swapping providers is a config change, not a refactor. Anything *outside*
the table above stays untouched.

### Path A — Migrate to Turnkey (HSM-backed signer)

Turnkey is server-side: no modal, no wallet popup. Keys are HSM-managed and
provisioned on demand for each Clerk user. Signing is an API call.

1. **Install + configure Turnkey**
   ```
   npm install @turnkey/sdk-server @turnkey/sdk-browser @turnkey/http
   ```
   Add to `.env`:
   ```
   TURNKEY_API_PUBLIC_KEY=...
   TURNKEY_API_PRIVATE_KEY=...
   TURNKEY_ORGANIZATION_ID=...
   NEXT_PUBLIC_WALLET_PROVIDER=turnkey
   ```

2. **Implement `TurnkeyAdapter`** in
   `src/lib/adapters/wallet/turnkey.adapter.ts`. Implement `WalletPort`:
   - `connect()`: ensures a Turnkey wallet exists for the current Clerk
     user (idempotent). Reads the address, returns. No UI prompt.
   - `getAddress()` / `getChainId()`: trivial — read from the Turnkey
     wallet record.
   - `signMessage` / `signTypedData` / `sendTransaction`: call Turnkey's
     `signRawPayload` / `signTransaction` API; broadcast via `viemAdapter`.
   - `getSmartAccountConfig()`: return `null` (Turnkey signers are EOAs),
     **unless** you compose Turnkey + Alchemy/ZeroDev (see Path B-bis).

3. **Add the Turnkey branch to `useWallet.ts`**:
   ```ts
   function useWalletTurnkey(): UseWalletReturn {
     // Calls a server route that ensures a Turnkey wallet exists,
     // returns address, exposes signMessage via /api/wallet/sign.
   }

   const PROVIDER = process.env.NEXT_PUBLIC_WALLET_PROVIDER ?? "web3auth";
   export const useWallet: () => UseWalletReturn =
     PROVIDER === "turnkey" ? useWalletTurnkey
     : isWeb3AuthConfigured  ? useWalletWeb3Auth
     :                          useWalletStub;
   ```

4. **Replace the wallet provider tree.** Turnkey doesn't need WagmiProvider
   for connection. Replace `<Web3AuthProviders>` in `app/layout.tsx` with a
   thin `<TurnkeyProvider>` (or simply drop the wallet provider wrapper —
   Turnkey is invisible). Keep `<WalletAutoDisconnect>` if you wire its
   internals to the Turnkey hook (or drop it; Turnkey has no client session
   to clear).

5. **Update the wallet-link adapter.** No change needed — Turnkey produces
   EIP-191 signatures that `viem.verifyMessage` already verifies.
   `clerkWalletLinkAdapter` continues to write
   `publicMetadata.primaryWallet`.

6. **Toggle `NEXT_PUBLIC_WALLET_PROVIDER=turnkey`**, restart, done. UI,
   routes, RBAC, audit log, gas policy — none of it changes.

**What you trade**: lose the social-login UX (Turnkey is a backend signer,
the user authenticates through Clerk only). Gain HSM-grade key custody, no
third-party MPC trust assumption, audit-friendly key lifecycle.

### Path B — Migrate to Alchemy Account Kit (smart accounts)

Alchemy gives you ERC-4337 smart accounts: gas sponsorship, batched tx,
session keys, programmable signers. The signer can be a passkey on the
user's device (no third-party custody at all).

1. **Install + configure**
   ```
   npm install @account-kit/core @account-kit/react @account-kit/infra
   ```
   Add to `.env`:
   ```
   NEXT_PUBLIC_ALCHEMY_API_KEY=...
   ALCHEMY_GAS_POLICY_ID=...
   NEXT_PUBLIC_WALLET_PROVIDER=alchemy
   ```

2. **Fill in the existing `AlchemyAdapter` stub** at
   `src/lib/adapters/wallet/alchemy.adapter.ts` (TODOs are already in place).
   Use the smart-account client to:
   - `connect()`: derive smart account from the chosen signer (passkey,
     email-OTP, or Alchemy Signer). Counterfactual address available
     immediately.
   - `sendTransaction()`: build a `UserOperation`, send through the
     bundler. Gas sponsorship applies automatically when
     `ALCHEMY_GAS_POLICY_ID` is set.
   - `getSmartAccountConfig()`: return `{ enabled: true, ... }` — already
     done in the stub.

3. **Add the Alchemy branch to `useWallet.ts`**:
   ```ts
   function useWalletAlchemy(): UseWalletReturn {
     // Use @account-kit/react hooks (useSmartAccountClient, etc.)
   }
   ```
   Update the export switch as in Path A.

4. **Mount Alchemy's React provider.** Add
   `src/components/providers/alchemy-providers.tsx` wrapping the
   `<AlchemyAccountProvider>` tree, and pick which to mount in
   `app/layout.tsx` based on `NEXT_PUBLIC_WALLET_PROVIDER`.

5. **Update the wallet-link verifier**.
   Smart accounts often sign via ERC-1271 (contract signatures), not
   EIP-191. Update `verifyAndLink` in
   `src/lib/adapters/wallet-link/clerk.adapter.ts` to use viem's public
   client `publicClient.verifyMessage(...)` instead of the standalone
   `verifyMessage`. The public-client variant auto-dispatches to ERC-1271
   for contract accounts. This is flagged in a comment at the top of the
   file.

6. **(Optional) Swap the gas-policy adapter** in `container.ts` from
   `noSponsorshipAdapter` to `alchemyGasManagerAdapter` so on-chain calls
   pull gas from your Paymaster.

7. **Toggle `NEXT_PUBLIC_WALLET_PROVIDER=alchemy`**, restart, done.

**What you gain**: smart-account features (sponsored gas, batched tx,
spending limits, session keys, recovery via guardians), passkey signers,
no third-party key custody. **What it costs**: more engineering, AA
primitives to think in, per-UserOp fees.

### Path B-bis — Turnkey signer + Alchemy smart account

These are not mutually exclusive. The "best institutional" stack is
Turnkey-as-signer + Alchemy-as-smart-account: keys in HSMs, smart-account
features on top. In code, this means a `TurnkeyAlchemyAdapter` whose owner
signer for the smart account is the Turnkey API. `WalletPort` doesn't need
to know — it just sees a smart account that can sign.

## What never changes during a swap

These are the abstractions that absorb the swap:

- `IdentityPort` (Clerk) — independent of wallet provider.
- `WalletLinkPort` interface — SIWE / signed-message proof works for any
  signer. Only the verifier (EIP-191 vs ERC-1271) may need to change.
- `useWallet()` shape — `UseWalletReturn` is the stable contract. Every
  component reads `address`, `isConnected`, `connect`, `disconnect`,
  `shortAddress` from it.
- All `/api/team/**`, `/api/wallet/**` routes — they go through
  `IdentityPort` and `WalletLinkPort`.
- All RBAC, all `IdentityControls`, all `OrganizationSwitcher` flows.
- All on-chain hooks under `src/lib/generated/**` — they use
  `useChainId` / `useReadContract` from wagmi which works against any
  wagmi-compatible adapter; for non-wagmi adapters, the codegen template
  reads from `WalletPort` instead.
- `WalletAutoDisconnect` — provider-agnostic via `useWallet().disconnect`.

## Quick reference: where is "the swap point"?

| Kind          | File                                                    | Lines you touch |
| ------------- | ------------------------------------------------------- | --------------- |
| Server pick   | `src/lib/container.server.ts`                           | `WALLET_PROVIDER` switch |
| Client pick   | `src/lib/container.ts`                                  | `pickWalletAdapter()` switch |
| Hook pick     | `src/lib/hooks/useWallet.ts`                            | `export const useWallet = ...` |
| Provider tree | `src/components/providers/<provider>-providers.tsx`     | new file or replace |
| Env           | `.env`                                                  | `NEXT_PUBLIC_WALLET_PROVIDER=...` |

## Operational notes

- **Web3Auth Dashboard** must whitelist your origins (e.g.
  `http://localhost:3000`, prod domain) under Whitelisted Domains.
- **Sapphire network** must match the Client ID's network. The codebase
  defaults to `SAPPHIRE_DEVNET` unless `NEXT_PUBLIC_WEB3AUTH_NETWORK=mainnet`.
- **`NEXT_PUBLIC_APP_URL`** should be set explicitly (`http://localhost:3000`
  in dev) so server-issued invitations have a deterministic redirect URL
  pointing at `/select-workspace`.
- **Audit log entries** for wallet linking (`wallet.linked`,
  `wallet.unlinked`) currently use the in-memory adapter. Swap to a DB
  adapter for production — this is unrelated to the wallet provider swap.

## TL;DR

Web3Auth is the **wallet** today. Clerk is the **identity** today and
forever. To swap to Turnkey or Alchemy, change the env var, drop in an
adapter that implements `WalletPort`, add a branch in `useWallet`, and
swap the React provider tree. Nothing else in the app needs to know.
