// ============================================================
// lib/adapters/platform-settings/drizzle.adapter.ts
// Postgres-backed PlatformSettingsPort.
//
// Upsert via ON CONFLICT (key) DO UPDATE so writes are idempotent
// per-key. Reads return null when the row doesn't exist — call sites
// fall back to env defaults in that case.
// ============================================================

import "server-only";

import { eq } from "drizzle-orm";
import { db } from "../../db";
import { platformSettings } from "../../db/schema";
import type { PlatformSettingsPort } from "../../ports/platform-settings.port";
import type {
  PlatformSettingKey,
  PlatformSettingValues,
} from "../../core/platform-settings";

class DrizzlePlatformSettingsAdapter implements PlatformSettingsPort {
  async get<K extends PlatformSettingKey>(
    key: K,
  ): Promise<PlatformSettingValues[K] | null> {
    const rows = await db
      .select({ value: platformSettings.value })
      .from(platformSettings)
      .where(eq(platformSettings.key, key))
      .limit(1);
    if (rows.length === 0) return null;
    return rows[0].value as PlatformSettingValues[K];
  }

  async set<K extends PlatformSettingKey>(
    key: K,
    value: PlatformSettingValues[K],
    actorUserId: string,
  ): Promise<void> {
    await db
      .insert(platformSettings)
      .values({
        key,
        value: value as unknown as Record<string, unknown>,
        updatedBy: actorUserId,
      })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: {
          value: value as unknown as Record<string, unknown>,
          updatedAt: new Date(),
          updatedBy: actorUserId,
        },
      });
  }
}

export const drizzlePlatformSettingsAdapter = new DrizzlePlatformSettingsAdapter();
