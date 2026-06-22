# Local Postgres for dev (and the Neon-compute incident that drove it)

Short version: dev no longer runs against Neon. Local Postgres in WSL is the
default `DATABASE_URL` for everyone working on the platform. Vercel still
talks to Neon (or a future cloud Postgres) for production and previews.

This document explains **why** we made that switch, **how** the local setup
works, and **how** to flip back to Neon when its monthly compute quota
resets (or when we move to a paid plan).

---

## 1. What happened (the incident)

While we were still pre-launch — no users, no public traffic — Neon emailed:

> You've used all of your monthly compute allowance for this project.

That was confusing because the project was effectively idle from a user
perspective. The cause turned out to be two background workloads that kept
Neon's compute permanently awake, so the **5-minute auto-suspend** that
makes the Free plan viable never fired:

1. **The chain indexer worker** (`yarn indexer`, deployed to Railway):
   - `src/lib/indexer/watch.ts` polled every **5 s** per chain.
   - Every tick ran *at least* two SELECTs against Neon
     (`access_managers`, `indexer_cursors`) before even checking whether
     the chain head had advanced.
2. **The email outbox drain loop** inside the same indexer process:
   - Hard-coded `intervalMs: 30_000` in `src/scripts/indexer.ts`
     (despite a log line claiming "2 min interval").
   - One outbox SELECT every 30 s, forever, even when the outbox was
     empty.

On top of that, `postgres-js` was configured with `idle_timeout: 30`, so
the TCP socket to Neon stayed open continuously between the 5 s polls.

**Result:** the Neon compute *literally never* had 5 minutes of idle. At
the autoscale floor of 0.25 CU, an always-on compute consumes
0.25 × 24 × 30 ≈ **180 CU-h/month** — the entire Free plan budget. We
exhausted it in roughly a week.

### What we tried first (and why it didn't help)

The instinct was: "create a new Neon project, point Vercel and local at
it, problem solved." **It did not work.**

Neon Free's compute-hour limit (≈191.9 CU-h/month) is enforced **per
account**, not per project. Creating a new project under the same Neon
account just shares the same exhausted budget. The very first migration
against the new project failed with:

```
PostgresError: Your account or project has exceeded the compute time
quota. Upgrade your plan to increase limits.
```

So we now had two empty/dead Neon projects on the same account, both
blocked, and `yarn db:migrate` couldn't run against either.

(The old Neon project has since been deleted; the new one stays as
production's eventual target.)

### How we stopped the bleed

- **Railway:** the indexer service was stopped via *Deployments → ⋯ →
  Remove*, with **Automatic Deployments** turned off so it wouldn't
  redeploy on the next push. Metrics flatlined to 0 within a minute.
  Env vars and the GitHub link are preserved; redeploy from the same tab
  when needed.
- **Code (perf commit `a2fdc45`):** cache short-circuits in the indexer
  so quiet chain ticks produce zero DB queries; slower poll cadences;
  shorter `idle_timeout`. See **§5 below** for the per-file summary or
  read the commit directly. With those in place, a fresh Neon quota
  should comfortably last a whole month, indexer running 24/7.

The compute quota itself resets at the start of each calendar month
(UTC). For us that's **July 1, 00:00 UTC**.

---

## 2. The local Postgres setup (now the default for dev)

WSL Ubuntu 22.04, native install, no Docker daemon to manage.

### One-time install

```bash
sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib
sudo service postgresql start

sudo -u postgres psql -c "CREATE USER qbridge WITH PASSWORD 'qbridge' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE qbridge OWNER qbridge;"
```

The `qbridge` / `qbridge` credentials are intentionally trivial — this
DB never holds anything sensitive, and it's bound to `localhost` only.

### Wire it into the app

In `.env.local`:

```
DATABASE_URL=postgresql://qbridge:qbridge@localhost:5432/qbridge

# Neon Postgres — kept here so we can switch back when the quota resets
# (July 1 UTC) or we move to a paid plan. Just swap which line is active.
# DATABASE_URL=postgresql://neondb_owner:<redacted>@<host>.neon.tech/neondb?sslmode=require
```

Verify reachable, then create the schema:

```bash
psql "postgresql://qbridge:qbridge@localhost:5432/qbridge" -c "SELECT version();"
yarn db:migrate
```

After migration, `\dt` against the local DB should show all nine tables
(`access_managers`, `audit_entries`, `indexer_cursors`,
`notification_outbox`, `notifications`, `platform_settings`,
`role_assignment_events`, `role_assignments`, `wallet_bindings`).

### After a WSL reboot

WSL2 doesn't run systemd by default, so Postgres won't auto-start. One
command per boot:

```bash
sudo service postgresql start
```

If that becomes annoying, enable systemd in WSL
(`/etc/wsl.conf` → `[boot] systemd=true`, then `wsl --shutdown` from
PowerShell). Optional; defer until it's actually painful.

### Node engine

The repo's `package.json` requires Node ≥ 20.19 and `.nvmrc` pins
**Node 22**. Cursor's bundled server injects its own Node 20.18 into
`PATH`, which beats nvm unless you prepend nvm's bin dir explicitly.
Add to the bottom of `~/.bashrc`:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="$HOME/.nvm/versions/node/v22.23.0/bin:$PATH"
```

Then `node --version` reports v22 from any new terminal.

---

## 3. How env precedence resolves

The codebase loads env in this order — later wins — both for Next.js dev
and for standalone scripts:

```9:17:src/scripts/_env.ts
// Precedence (later wins): .env  →  .env.local
// Matches Next.js's loader so the indexer and the app see the
// same DATABASE_URL.
// ============================================================

import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local", override: true });
```

`.env.local` is gitignored. **Edit `DATABASE_URL` only in `.env.local`** —
not `.env`. Changes there are silently overridden by `.env.local` even
when they look like they should take effect.

---

## 4. Switching back to Neon (when ready)

Two checkpoints:

1. **Quota:** confirm the Neon account is back below the cap (their
   dashboard shows current compute hours). On Free that means waiting
   for the first of the next month UTC, or upgrading to a paid plan.
2. **Schema:** the current Neon project is **empty** — migrations never
   landed because the quota was already exhausted. Before pointing
   anything at it, run `yarn db:migrate` once locally with the Neon URL
   exported in your shell:

   ```bash
   DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" yarn db:migrate
   ```

Then:

- **Local dev**: edit `.env.local`, comment out the local URL, uncomment
  the Neon URL. Restart `yarn dev` (postgres-js caches the pool on
  `globalThis.__qbridgePg`; HMR alone won't pick up the new URL).
- **Vercel**: confirm `DATABASE_URL` in *Settings → Environment Variables*
  is the Neon URL. Trigger a redeploy (Vercel doesn't re-evaluate env
  vars on existing deployments).
- **Railway indexer**: when you want live event indexing again,
  *Deployments → New Deployment* on the service. Verify Neon's compute
  hours stop climbing immediately afterward — if they don't, the perf
  fixes regressed and `backfill.ts`'s `lastSeenHead` short-circuit is
  the place to look.

**Use Neon's pooled URL** (the one with `-pooler` in the hostname) for
Vercel. Serverless functions each open their own connection pool, and
without the pooler the project will hit Neon's per-compute connection
cap (~100) under any real load. `src/lib/db/index.ts` already sets
`prepare: false`, which is the requirement for `postgres-js` to work
with the Neon pooler in transaction mode.

---

## 5. The perf changes that make Neon viable again

Commit `a2fdc45` —
*perf(indexer,db): cut Neon compute load with cache short-circuits and tighter intervals*.

| File | Change |
|---|---|
| `src/lib/indexer/backfill.ts` | In-memory caches: `lastSeenHead`, `cursorCache`, and a 5-min-TTL `amsCache`. Fetch RPC head **first**; if the chain hasn't advanced, return with zero DB queries. |
| `src/lib/indexer/watch.ts` | `DEFAULT_POLL_MS`: `5_000` → `30_000`. Still inside one Sepolia block of inclusion. |
| `src/scripts/indexer.ts` | Email outbox drain interval `30_000` → `5 * 60_000` (matching the log message the code was already lying about). |
| `src/lib/db/index.ts` | `idle_timeout`: `30` → `5` s, so postgres-js doesn't keep a socket warm across long idle gaps. |

What a quiet minute on Neon looks like *after* these changes, with the
indexer running:

- **Chain advanced 0 times:** 2 indexer ticks × (1 RPC, 0 DB) = 0 DB load.
- **Chain advanced once:** ~1 cursor SELECT (cached), 1 `getLogs`, 1
  cursor UPDATE. Everything else: 0.
- **Email outbox:** 1 LIMIT-bounded SELECT every 5 min, empty unless
  there's actually mail to send.

Versus before: 12 indexer ticks × ≥2 SELECTs each + 2 outbox polls per
minute + permanently-open TCP socket. Roughly a **20-30× reduction** in
connection-time-on Neon, which is the metric that actually bills.

---

## 6. Cross-references

- **`docs/database-and-chain-roles.md`** — how Postgres relates to the
  on-chain AccessManagers, what the indexer materializes, and why
  Postgres is a fast snapshot rather than authoritative state.
- **Neon docs — limits & compute hours**: https://neon.tech/docs/introduction/about
- **`CLAUDE.md`** — top-level repo contract; this doc supersedes its
  "DATABASE_URL is in `.env.local`" note with concrete setup steps.
