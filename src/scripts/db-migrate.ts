// ============================================================
// scripts/db-migrate.ts
//
// Applies pending Drizzle migrations using the same postgres-js
// client config the app uses. Use this instead of `drizzle-kit migrate`
// when the latter dies silently (common with Neon / pgbouncer).
//
//   yarn db:migrate
//
// Idempotent: drizzle-orm's migrator tracks applied migrations in a
// `drizzle.__drizzle_migrations` table and skips ones already run.
// ============================================================

import "./_env";

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  console.log("[migrate] connecting…");
  // `max: 1` is required by the migrator (single connection for the
  // duration of the migration). `prepare: false` keeps things sane
  // behind pgbouncer / Neon's pooler.
  const sql = postgres(url, { max: 1, prepare: false });
  const db = drizzle(sql);

  try {
    console.log("[migrate] applying migrations from ./src/lib/db/migrations …");
    await migrate(db, { migrationsFolder: "./src/lib/db/migrations" });
    console.log("[migrate] done");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
