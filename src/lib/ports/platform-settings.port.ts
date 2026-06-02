// ============================================================
// lib/ports/platform-settings.port.ts
// Runtime-toggleable platform config.
//
// Implemented by:
//   - MemoryPlatformSettingsAdapter  (dev / no DB)
//   - DrizzlePlatformSettingsAdapter (Postgres, prod)
//
// Typed against the PlatformSettingKey union so call sites can't
// fetch a setting that doesn't exist.
// ============================================================

import type {
  PlatformSettingKey,
  PlatformSettingValues,
} from "../core/platform-settings";

export interface PlatformSettingsPort {
  /** Returns the stored value, or null if no row exists for this key. */
  get<K extends PlatformSettingKey>(
    key: K,
  ): Promise<PlatformSettingValues[K] | null>;

  /** Upserts the value with attribution. The route boundary is
   *  responsible for validating the value via PLATFORM_SETTING_VALIDATORS. */
  set<K extends PlatformSettingKey>(
    key: K,
    value: PlatformSettingValues[K],
    actorUserId: string,
  ): Promise<void>;
}
