// ============================================================
// drizzle.config.ts
// Used by drizzle-kit (generate / migrate / studio).
// Reads DATABASE_URL from .env.local (loaded by Next.js at runtime
// too, so the same value works for the app + indexer + migrations).
// ============================================================

import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local (see .env.example).",
  );
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
