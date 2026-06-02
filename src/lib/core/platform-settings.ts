// ============================================================
// lib/core/platform-settings.ts
// Typed key/value contract for runtime-toggleable platform config.
//
// Each new setting:
//   1. Add a literal to PlatformSettingKey
//   2. Add the value shape to PlatformSettingValues
//   3. Add a validator to PLATFORM_SETTING_VALIDATORS so writes
//      can't corrupt the DB with a bad value.
//
// The port (PlatformSettingsPort) is intentionally typed via these
// maps so call sites can't ask for a key that doesn't exist.
// ============================================================

/** Dotted-namespace keys. Add new ones here as ops needs surface. */
export type PlatformSettingKey = "kyb.tier";

/** Per-key value shape. */
export interface PlatformSettingValues {
  /** Active Sumsub KYB tier — overrides SUMSUB_KYB_LEVEL_TIER env. */
  "kyb.tier": "basic" | "full";
}

/** Per-key runtime validator. Returns the parsed value when valid,
 *  null when invalid. Used by setSetting at the route boundary so an
 *  ops admin can never write a malformed value to the DB. */
export const PLATFORM_SETTING_VALIDATORS: {
  [K in PlatformSettingKey]: (raw: unknown) => PlatformSettingValues[K] | null;
} = {
  "kyb.tier": (raw) =>
    raw === "basic" || raw === "full" ? raw : null,
};
