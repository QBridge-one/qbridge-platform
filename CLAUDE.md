# CLAUDE.md

Guidance for AI assistants working in this repo. Keep changes consistent with
the conventions below. (Cursor users: mirrors `.cursor/rules/*`, which is local
/ gitignored — this file is the committed source of truth.)

## What this is

QBridge — a platform for tokenizing real-world assets and registering verified
issuers on-chain. Issuers self-onboard with **KYB** (Persona / Sumsub), ops
reviewers approve and **register them on-chain**, and access is governed by
on-chain **AccessManager** contracts. Two planes: **ops** (`/ops/**`) and
**issuer workspace** (`/workspace/**`).

## Stack

Next.js 16 (App Router, RSC) · React 19 · TypeScript · Tailwind + shadcn ·
wagmi 3 / viem 2.52 · Clerk (identity) · Privy (embedded MPC wallet) ·
Drizzle + Postgres (Neon) · Sumsub/Persona (KYB) · Resend (email).

## Commands

```
yarn dev            # Next dev server
yarn build          # production build (also type-checks — must pass)
yarn lint
yarn generate       # codegen contract hooks/forms from src/contracts/**/abi.json
yarn db:generate    # generate a Drizzle migration from schema.ts
yarn db:migrate     # apply migrations
yarn indexer        # chain-role indexer worker (Railway)
```

Type-check directly: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p tsconfig.json`
(the dependency tree OOMs the default heap).

## Architecture — hexagonal (ports & adapters)

```
src/app/                pages (Server Components by default)
src/components/          UI
src/lib/generated/       generated contract hooks/forms — the primary contract interface
src/lib/services/        orchestration (e.g. transaction.service.ts)
src/lib/ports/           interfaces only (import only from lib/core/)
src/lib/adapters/        implementations (one adapter ↔ one port)
src/lib/container.ts          wires client-safe adapters  ← only place that imports concrete adapters
src/lib/container.server.ts   wires server-only adapters (identity, org, wallet-binding, audit, …)
```

## Hard rules (do not break)

- **Never import a concrete adapter outside `container.ts` / `container.server.ts`.**
- **Never import a wallet vendor SDK (`@privy-io/react-auth`, `wagmi`) in components** — use `useWallet()` from `src/lib/hooks/useWallet.ts`.
- **Never edit `src/lib/generated/**`** — re-run `yarn generate`. Don't import `abi.json` in components; use the generated typed constants / `registry.ts`. Don't hardcode contract addresses.
- Never skip layers (UI → hooks → services → ports → adapters). Adapters translate; services orchestrate; adapters catch and `normalizeToDomainError(err)`; UI only sees `DomainError`.
- No `localStorage`/`sessionStorage`; no external state lib (wagmi + `useState` only).
- **Never install an npm package without asking.** Keep ABIs/app code under `src/`.
- Off-chain RBAC (`src/lib/auth/permissions.ts`, `can(role, perm)`) never grants on-chain authority — the AccessManager contracts are the real gate.

## Identity & wallet

- **Clerk is the only login.** `IDENTITY_PROVIDER=clerk`. Orgs are tagged
  `publicMetadata.kind = "ops" | "issuer"`.
- **Privy is the embedded MPC wallet** (not a login): it authenticates from the
  Clerk session JWT (custom auth) and provisions one wallet per user. The
  client boundary is `useWallet()`; on-chain writes go through
  `transaction.service` → `WalletPort` → Privy's `useSendTransaction`.
- The **wallet↔user binding** is canonical in Postgres (`wallet_bindings`),
  written server-side from a verified Privy identity token (`POST
  /api/wallet/bind`) — not Clerk metadata, not SIWE. `primaryWallet` reads from
  the binding store (Clerk metadata = legacy fallback).
- Gas sponsorship is opt-in (`NEXT_PUBLIC_PRIVY_SPONSOR_GAS`, off by default);
  on-chain writes show a pre-sign confirmation modal.
- Full detail: **`Docs/WALLET-PROVIDER.md`** and **`Docs/IDENTITY.md`**.

## Environment / gotchas

- **Node ≥ 20.19** required (`.nvmrc` = 22; Privy's crypto deps need it).
- Keep the dependency pins: **`@wagmi/core@3.4.0`** (direct dep, matches
  `wagmi@3.5`) and the **`viem` 2.52.0 resolution** — they dedupe Privy's heavy
  tree to single versions. Removing them reintroduces duplicate-package type errors.
- Secrets live in `.env` / `.env.local` (gitignored); see `.env.example`.
- `DATABASE_URL` is in `.env.local`; migrations are **not** auto-run on deploy —
  run `yarn db:migrate` against prod manually.

## Docs

- `docs/platform-contracts.md` — **contract topology** (platform singletons vs per-deal clusters), Sepolia addresses, how each class is integrated. Read before wiring a new contract.
- `Docs/WALLET-PROVIDER.md` — wallet architecture (Privy, binding, sponsorship)
- `Docs/IDENTITY.md` — Clerk identity, planes, RBAC
- `docs/issuer-registry-integration.md` · `docs/issuer-registry-lifecycle.md` ·
  `docs/database-and-chain-roles.md` · `docs/kyb-verification-provider.md` ·
  `docs/notifications-and-email.md`

For Privy questions, the Privy docs are queryable via their MCP at
`https://docs.privy.io/mcp` (`search_privy_docs` + `query_docs_filesystem`).
