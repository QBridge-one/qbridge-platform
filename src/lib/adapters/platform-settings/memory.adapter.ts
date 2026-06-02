// ============================================================
// lib/adapters/platform-settings/memory.adapter.ts
// Process-local PlatformSettingsPort — dev / no-DB fallback.
// State evaporates on restart; production uses the Drizzle adapter.
// ============================================================

import type { PlatformSettingsPort } from "../../ports/platform-settings.port";
import type {
  PlatformSettingKey,
  PlatformSettingValues,
} from "../../core/platform-settings";

class MemoryPlatformSettingsAdapter implements PlatformSettingsPort {
  private values = new Map<string, unknown>();

  async get<K extends PlatformSettingKey>(
    key: K,
  ): Promise<PlatformSettingValues[K] | null> {
    const v = this.values.get(key);
    return (v ?? null) as PlatformSettingValues[K] | null;
  }

  async set<K extends PlatformSettingKey>(
    key: K,
    value: PlatformSettingValues[K],
    _actorUserId: string,
  ): Promise<void> {
    this.values.set(key, value);
  }
}

export const memoryPlatformSettingsAdapter = new MemoryPlatformSettingsAdapter();
