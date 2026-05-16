// ============================================================
// lib/db/index.ts — Shared Drizzle client (postgres-js driver).
//
// One client instance is reused per process; in dev we cache on
// globalThis so hot-reload doesn't open a new pool per change.
//
// The `postgres` driver uses Node net APIs that will break in a
// browser bundle. Callers MUST be server-side: Server Components,
// route handlers, or the standalone indexer worker. To prevent
// accidental client imports, add `import "server-only"` to the
// thin wrappers that consume this client (see lib/team/chain-roles.ts).
// We can't add it here because the indexer is a plain Node script
// — `server-only` throws outside the Next.js bundler.
// ============================================================

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __qbridgePg: ReturnType<typeof postgres> | undefined;
}

function makeClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (see .env.example).",
    );
  }
  return postgres(url, {
    // Conservative pool size — the indexer and Next.js share the same
    // hosted PG in prod and we don't want either to starve the other.
    max: 10,
    idle_timeout: 30,
    // Required by some hosted PGs (Supabase, Neon) when pooled mode is off.
    prepare: false,
  });
}

const pg =
  globalThis.__qbridgePg ??
  (globalThis.__qbridgePg = makeClient());

export const db = drizzle(pg, { schema });
export { schema };
