# Database, Drizzle & chain-role indexing

This document explains how **Postgres (Neon)**, **Drizzle**, the **indexer worker**, and the **Team & access** UI fit together—the source of truth for “who holds which on-chain roles” vs what appears in your dashboard tables.

---

## 1. The big picture (two truths)

| Layer | Role | Canonical for… |
|--------|------|----------------|
| **Blockchain** (`AccessManager` contracts) | Enforces transfers, `grantRole` / `revokeRole`, delays, etc. | **Real authority.** If Postgres disagrees with chain, chain wins for execution. |
| **Postgres (Neon)** | Materialized snapshot of AccessManager **`RoleGranted`** / **`RoleRevoked`** (and metadata about which contracts you index). | **Fast reads & joins** for the Next.js dashboard (SSR) without hammering RPC on every page view. |

The app **never** substitutes Postgres for executing on-chain ops. Signing and transactions still use the wallet + RPC from the browser (or approved server routes)—same as before.

---

## 2. What reads from chain vs Postgres

### On-chain reads (wallet / UX)

When you flip a toggle in Team access, code uses **wagmi/viem + `simulateContract`** (and then a real tx) against the deployed **Platform** or **Token** `AccessManager`. That flow is independent of Postgres.

### Dashboard table after **full reload** (“Chain roles” column)

Built on **Postgres only**, server-side:

- `src/app/ops/settings/team/page.tsx` and `src/app/workspace/settings/team/page.tsx` call **`getChainRolesForWallets`** from **`src/lib/team/chain-roles.ts`**.

So: **SSR team pages do not call `eth_getLogs` per member**. They **`SELECT`** from Neon.

### Immediate UI after granting (same session)

The client applies **optimistic** updates when a transaction succeeds, so badges can flip before Postgres catches up—by design.

---

## 3. How Postgres gets populated: the indexer (not a chain “websocket listener”)

The worker is **`yarn indexer`** (`src/scripts/indexer.ts`). It runs as a **long-lived Node process** (local terminal, or **Railway** in production—not Vercel serverless).

**What it actually does:**

1. **Bootstrap** (`src/lib/indexer/bootstrap.ts`): upserts **`access_managers`** rows for each configured AM address (from env)—so the indexer knows **which contracts** belong to ops vs issuer workspace on each chain.

2. **Backfill** (`src/lib/indexer/backfill.ts`): walks block ranges with **`eth_getLogs`** from a stored cursor (**`indexer_cursors`**), chunked (public RPC-friendly).

3. **Watch / live tail** (`src/lib/indexer/watch.ts`): **polls** (default ~5 s)—we **avoid** subscription filters (`eth_newFilter`), which break on many free RPCs. Each tick is effectively another incremental backfill to chain head.

4. **Events → rows** (`src/lib/indexer/process-event.ts`): for each decoded `RoleGranted` / `RoleRevoked`, writes an append-only **`role_assignment_events`** row **and** updates the materialized **`role_assignments`** state (idempotent writes).

Persistent schema lives in Drizzle (**`src/lib/db/schema.ts`**) + SQL migrations (**`src/lib/db/migrations/`**). Apply with **`yarn db:migrate`** against the same **`DATABASE_URL`** you give Vercel and the indexer.

---

## 4. Why it can feel like “listening” despite polling

Architecturally this is **event ingestion**: you replay **canonical logs** emitted by OpenZeppelin `AccessManager`. Operationally we use **polling + `getLogs`** because unreliable filter subscriptions wasted debug time—semantics vs chain explorers stay the same once logs are mined.

---

## 5. Repo layout relevant to Neon / Drizzle / Railway

| Artifact | Purpose |
|----------|---------|
| `src/lib/db/schema.ts` | Drizzle tables: `access_managers`, `role_assignments`, `role_assignment_events`, `indexer_cursors`. |
| `src/lib/db/index.ts` | Lazy Postgres pool + Drizzle client (safe for Next build without DB at compile time). |
| `src/scripts/db-migrate.ts` | Applies migrations robustly vs Neon/pgBouncer quirks. **`yarn db:migrate`**. |
| `src/scripts/indexer.ts` | Indexer entrypoint.**`yarn indexer`**/**`yarn indexer:once`**. |
| `src/lib/indexer/*` | ABI subset, bootstrap, backfill, watch, RPC cache. |
| `Dockerfile` | **Railway indexer image** (`node:22` → install deps → **`CMD yarn indexer`**). Root path so hosts auto-detect. |
| `railway.json` | Railway config-as-code: Docker build, restart policy, healthcheck. |
| `.dockerignore` | Keeps `node_modules`, `.next`, **`.env*`** out of images. |
| `.node-version` / `.nvmrc` | Node 22 hints for dev/CI—not required if Docker builds on Railway. |

**Removed redundancy:** older **Nixpacks-only** configs are gone; **Docker is the single supported path** for deploying this indexer—you don’t maintain two builders.

---

## 6. Environment variables—who needs what?

### Vercel (Next.js web app)

- **`DATABASE_URL`** — same Neon DB **if** SSR team pages hydrate chain roles there.
- Clerk / Web3 / other app secrets—as already documented—**Railway indexer does not run Clerk.**

### Railway (indexer worker only—no Next build in container)

Minimal set aligns with **`src/scripts/indexer.ts`** headers:

| Variable | Required? | Role |
|-----------|-----------|------|
| `DATABASE_URL` | **Yes** | Postgres connection string (paste raw Neon URI). |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Optional* | Defaults to a public RPC if unset; prod should use Alchemy / Infura / etc. (`NEXT_PUBLIC_*` name is legacy; worker reads env at runtime.) |
| `NEXT_PUBLIC_PLATFORM_AM_SEPOLIA` / `NEXT_PUBLIC_TOKEN_AM_SEPOLIA` | **Recommended** | Bootstrap inserts AM rows; without them indexing that AM is skipped until set. |
| `INDEXER_START_BLOCK_*` / `INDEXER_BACKFILL_CHUNK` | Optional | Tuning—see `.env.example`. |
| **`PORT`** | **Injected by Railway** | Minimal HTTP **`200`** on **`/`** for deploy healthchecks (see indexer script). |

**Never** paste `${{ Postgres.DATABASE_URL }}` unless your database is Railway’s Postgres plugin—you use Neon, so **`DATABASE_URL` = full Neon URL**.

### Duplicate indexers

Any process with the **same **`DATABASE_URL`**** duplicates writes—they’re idempotent, but overlapping **local **`yarn indexer`**** plus **Railway** while debugging explains “Railway redeploy failing but dashboard still updating.” Prefer **Railway prod** only + **Neon branch** dedicated to development.

---

## 7. Operational checklist

1. **Neon** — create **`production`** (or isolate dev branch). Copy connection string → **`DATABASE_URL`** on **Vercel** + **Railway**.  
2. **Run migrations once**: `DATABASE_URL='…neon…' yarn db:migrate`.  
3. **Deploy indexer** Railway with env above; logs should show **`[indexer] probe listening`**, **`[bootstrap]`**, **`[watch]`**.  
4. **Grant roles** via app; indexer writes rows → **refresh** team page confirms SSR matches chain (after indexer processed the block).

---

## 8. Troubleshooting cheatsheet

| Symptom | Likely cause |
|---------|----------------|
| Deploy OK, infinite **service unavailable / healthcheck** | Missing **`DATABASE_URL`**, **`PORT`** bind race fixed in code but ensure latest image, or overload before listen. |
| **Build** fails Node 18 vs Clerk engines | Wrong builder—ensure **Docker** image (**`Dockerfile`**), not bare Nixpacks. |
| Table empty after reload | Indexer stopped; wrong **`DATABASE_URL`**; AM env missing; migrations not applied. |
| Table shows stale roles | Cursor lag vs chain head; indexer crash; RPC rate limits (**`poll failed`** in logs). |

---

## 9. Architectural diagram (mental model)

```
                    ┌───────────────┐
   grant/revoke     │   Blockchain  │
   (wallet txs) ──▶ │ AccessManager │
                    └───────┬───────┘
                            │ logs: RoleGranted / RoleRevoked
                            ▼
                    ┌───────────────┐
           poll     │    Indexer    │  ◀── Railway (prod) OR local yarn indexer
           getLogs │  (tsx worker) │
                    └───────┬───────┘
                            │ Drizzle INSERT
                            ▼
                    ┌───────────────┐
                    │ Neon Postgres │
                    │ role_assign_* │
                    └───────┬───────┘
                            │ Drizzle SELECT
                            ▼
                    ┌───────────────┐
           SSR       │ Next.js/Vercel│
                    │ ops/workspace │
                    │  team tables  │
                    └───────────────┘

Browser optimistic chips: bypass Postgres until reload.
```

This is the authoritative internal doc for contributors on **why** Postgres exists and **who** fills it—not a replacement for public product docs unless you relocate or rewrite for customers.
