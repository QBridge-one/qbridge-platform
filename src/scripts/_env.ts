// ============================================================
// scripts/_env.ts
// Loads env files BEFORE any other module evaluates `process.env`.
// Import this as the very first line of any standalone script
// (db-migrate, indexer, etc.) — otherwise modules like @/lib/db
// read `process.env.DATABASE_URL` at module init, before dotenv
// gets a chance to apply .env.local overrides.
//
// Precedence (later wins): .env  →  .env.local
// Matches Next.js's loader so the indexer and the app see the
// same DATABASE_URL.
// ============================================================

import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local", override: true });
