# QBridge — Identity & Workspaces (Pluggable IdP)

This document describes the auth/identity architecture and the exact steps to
enable a real IdP (Clerk first, WorkOS later) without touching feature code.

## Mental model

Three independent layers, intentionally separated:

| Layer            | Source of truth        | Examples                                    |
| ---------------- | ---------------------- | ------------------------------------------- |
| Identity         | IdP (Clerk / WorkOS)   | who is the user, which org are they in      |
| Off-chain RBAC   | `lib/auth/permissions` | can this UI button render? can this API run?|
| On-chain RBAC    | AccessManager contracts| can this address execute this function?     |

**Off-chain RBAC never grants on-chain authority.** Chain authority is enforced
by `PlatformAccessManager` / `TokenAccessManager`. The dashboard role only
decides what UI/API surface a user can touch.

## Two planes

| Plane     | URL prefix     | Org kind    | Roles                            |
| --------- | -------------- | ----------- | -------------------------------- |
| Ops       | `/ops/**`      | `ops`       | `ops_admin`, `ops_member`        |
| Workspace | `/workspace/**`| `issuer`    | `issuer_admin`, `issuer_member`  |

Each issuer = one organization in the IdP. QBridge internal team = one ops
organization. A user can belong to multiple orgs; the active one is set by
the IdP session and resolved server-side.

## Architecture

Follows the existing hexagonal pattern. Adapters are wired in two DI files:

- `src/lib/container.ts` — **client-safe**. Wallet, blockchain, intent,
  broadcast, gas-policy, multisig, compliance, and `transactionService`.
- `src/lib/container.server.ts` — **server-only**. Identity, organization,
  auth-webhook, wallet-link, audit-log. Imports `server-only` so a stray
  client import is a build error.

```
Ports (interfaces)                      Adapters
  IdentityPort       ←   memory.adapter | clerk.adapter | workos.adapter
  OrganizationPort   ←   memory.adapter | clerk.adapter | workos.adapter
  AuthWebhookPort    ←   memory.adapter | clerk.adapter | workos.adapter
  WalletBindingPort  ←   memory.adapter | drizzle.adapter (Postgres)
  AuditLogPort       ←   memory.adapter | drizzle.adapter (Postgres)
```

| File                                                            | Purpose                                                |
| --------------------------------------------------------------- | ------------------------------------------------------ |
| `src/lib/core/identity.types.ts`                                | Vendor-agnostic domain types (AppUser, AppOrg, …)      |
| `src/lib/ports/identity.port.ts`                                | `getSession`, `requireSession`                         |
| `src/lib/ports/organization.port.ts`                            | `inviteMember`, `listMembers`, `updateMemberRole`, …   |
| `src/lib/ports/auth-webhook.port.ts`                            | Verify + normalize IdP webhooks                        |
| `src/lib/ports/wallet-binding.port.ts`                          | Canonical user → wallet record (Postgres)              |
| `src/lib/ports/audit-log.port.ts`                               | Append-only off-chain audit trail                      |
| `src/lib/auth/permissions.ts`                                   | `can(role, perm)` — pure code policy                   |
| `src/lib/auth/server.ts`                                        | Server-only: `requireSession/requireOrg/requirePermission` |
| `src/lib/auth/api.ts`                                           | DomainError → HTTP status mapping                      |
| `src/lib/services/identity-mirror.service.ts`                   | Apply IdP webhooks to our store                        |
| `src/middleware.ts`                                             | Plane tag header + (future) Clerk middleware           |
| `src/components/providers/identity-provider.tsx`                | Client provider (today no-op; future ClerkProvider)    |
| `src/app/api/team/invite/route.ts`                              | Workspace/Ops invite                                   |
| `src/app/api/team/invite/[id]/route.ts`                         | Revoke invite                                          |
| `src/app/api/team/members/route.ts`                             | List members                                           |
| `src/app/api/team/members/[userId]/route.ts`                    | Update role / remove                                   |
| `src/app/api/wallet/bind/route.ts`                              | Verify Privy identity token, persist binding (Postgres)|
| `src/app/api/webhooks/identity/route.ts`                        | IdP webhook receiver                                   |
| `src/app/api/session/route.ts`                                  | Read current session for client UIs                    |

## Default mode (today): memory

`IDENTITY_PROVIDER=memory` (default). A process-local store seeds:

- one ops org (`QBridge Ops`)
- one issuer org (`Demo Issuer`)
- a single user (`user_dev_root`) who is admin of both

The middleware tags requests with `x-qbridge-plane` (`ops`/`issuer`) based on
the route prefix or, for `/api/*` calls, the `Referer` header. The memory
identity adapter uses that tag to choose the active org so both `/ops/*` and
`/workspace/*` work without configuration.

This mode is sufficient for development and review previews. **Never deploy
this to production** — there is no real authentication.

## Clerk mode (active today)

Already wired. To run against Clerk you only need env vars + a Clerk dashboard
configured for Organizations + a webhook.

### Required env (in `.env` / your deploy env)

```env
IDENTITY_PROVIDER=clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...   # from Clerk Dashboard → Webhooks
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/select-workspace
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/select-workspace
```

If `IDENTITY_PROVIDER` is anything other than `clerk`, the memory adapter is
used and Clerk SDK calls are bypassed.

### Clerk dashboard checklist

- Enable **Organizations** for the instance.
- For each org you create (or via API), set `publicMetadata.kind` to
  `"ops"` or `"issuer"`. Issuer orgs may also set
  `publicMetadata.issuerId` (your KYB record id).
- Add a webhook endpoint:
  - URL: `https://{your-host}/api/webhooks/identity`
  - Events: all `user.*`, `organization.*`, `organizationMembership.*`,
    `organizationInvitation.*`.
  - Signing secret → set as `CLERK_WEBHOOK_SECRET` in env.

### Routes added by the integration

| Path                                  | Purpose                                       |
| ------------------------------------- | --------------------------------------------- |
| `/sign-in/[[...sign-in]]`             | Clerk hosted `<SignIn />`                     |
| `/sign-up/[[...sign-up]]`             | Clerk hosted `<SignUp />`                     |
| `/select-workspace`                   | Post-login org chooser; routes to plane      |
| `/api/webhooks/identity`              | Clerk webhook receiver (svix-verified)        |
| `/api/wallet/bind`                    | Bind wallet from a verified Privy identity token |
| `/api/team/...`, `/api/team/members*` | Invite / list / role / remove                 |
| `/api/session`                        | Read current session for client UIs           |

### Org plane enforcement

`/ops/**` and `/workspace/**` layouts call `getSession()` server-side and
`redirect("/select-workspace")` if:

- no Clerk session → redirected first by middleware to `/sign-in`,
- no active org,
- active org's `kind` doesn't match the route plane,
- user lacks the plane's `:view` permission.

Users can switch active org via the `<OrganizationSwitcher>` rendered in the
dashboard header (`components/dashboard/identity-controls.tsx`).

### Postgres-backed stores

`WalletBindingPort` and `AuditLogPort` are already **Drizzle/Postgres-backed**
when `DATABASE_URL` is set (in-memory fallback otherwise). The remaining
in-memory store is the IdP mirror: `applyAuthEvent` in
`src/lib/services/identity-mirror.service.ts` writes user/org/membership state
from Clerk webhooks into a process-local store — swap those calls to DB writes
to make it durable too.

## Switching to WorkOS later

Only three files change:

1. Add `src/lib/adapters/identity/workos.adapter.ts`
2. Add `src/lib/adapters/organization/workos.adapter.ts`
3. Add `src/lib/adapters/auth-webhook/workos.adapter.ts`

Then in `container.ts` extend the `IDENTITY_PROVIDER` switch:

```ts
const provider = process.env.IDENTITY_PROVIDER ?? "memory";
export const identityAdapter =
  provider === "clerk"  ? clerkIdentityAdapter  :
  provider === "workos" ? workosIdentityAdapter :
  memoryIdentityAdapter;
```

Nothing in `app/`, `components/`, `lib/services/`, or `lib/auth/` changes.

## Wallet binding

The user's wallet is Privy's embedded MPC wallet. It is bound to the Clerk
user **automatically and server-side** — no signed message, no popup:

1. On login, Privy provisions the embedded wallet (`createOnLogin`).
2. `<PrivyAutoBind>` posts the Privy **identity token** (`useIdentityToken()`)
   to `POST /api/wallet/bind`.
3. The route authenticates the Clerk user (`requireSession()`) and verifies the
   token with `@privy-io/server-auth` `getUser({ idToken })`, extracting the
   embedded wallet address from the **verified** linked accounts.
4. The address is written to the Postgres `wallet_bindings` table via
   `WalletBindingPort`, and a `wallet.linked` audit entry is appended.

`primaryWallet` is then read from the binding store (Clerk metadata is only a
legacy fallback). See `Docs/WALLET-PROVIDER.md` for the full wallet
architecture. UI hook: `useWalletBind()` in `src/lib/hooks/useWalletBind.ts`.

## Permissions

`can(role, "<perm>")` is the only call site that decides off-chain access.
Add new permissions in `src/lib/auth/permissions.ts`, never inline strings.

```ts
import { can } from "@/lib/auth/permissions"
if (can(session.appRole, "workspace:team:invite")) { /* show invite UI */ }
```

Server-side, prefer `requirePermission(perm)` which throws a typed
`DomainError` mapped to a correct HTTP status by `lib/auth/api.ts`.
