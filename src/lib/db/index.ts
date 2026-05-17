// ============================================================
// lib/db/index.ts — Shared Drizzle client (postgres-js driver).
//
// Lazy initialization: importing this module MUST NOT touch DATABASE_URL or
// open a PG socket — `next build` evaluates server-route modules while
// collecting page data without production env vars. Consumers that need
// the DB invoke `db` at runtime via the Proxy below; callers that handle
// missing DB (Team pages) trap errors and degrade gracefully.
//
// In dev we cache on globalThis.__qbridgePg so hot-reload doesn't open a
// new pool per change.
//
// The `postgres` driver uses Node net APIs that break in a browser bundle.
// Callers MUST be server-side: Server Components, route handlers, or the
// standalone indexer worker.
// ============================================================

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __qbridgePg: ReturnType<typeof postgres> | undefined;
  var __qbridgeDrizzle: PostgresJsDatabase<typeof schema> | undefined;
}

type Db = PostgresJsDatabase<typeof schema>;

function makeClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (see .env.example).",
    );
  }
  return postgres(url, {
    max: 10,
    idle_timeout: 30,
    prepare: false,
  });
}

function getLazyDrizzle(): Db {
  if (!globalThis.__qbridgePg) {
    globalThis.__qbridgePg = makeClient();
  }
  if (!globalThis.__qbridgeDrizzle) {
    globalThis.__qbridgeDrizzle = drizzle(globalThis.__qbridgePg, {
      schema,
    });
  }
  return globalThis.__qbridgeDrizzle;
}

export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const actual = getLazyDrizzle() as unknown as Record<
      PropertyKey,
      unknown
    >;
    const value = Reflect.get(actual, prop, receiver);
    if (typeof value === "function") {
      return value.bind(actual);
    }
    return value;
  },
});

export { schema };
