/** platform-access-manager -> PLATFORM_ACCESS_MANAGER_ABI */
export function abiExportConstName(featureKey: string): string {
  return (
    featureKey
      .split("-")
      .map((s) => s.toUpperCase())
      .join("_") + "_ABI"
  );
}
