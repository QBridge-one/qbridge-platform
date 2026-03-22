import { autoGenHeader, toHookBaseName } from "./code-writer";
import type { AbiFunctionItem } from "./abi-resolver";
import type { ContractManifest } from "./manifest-schema";
import { abiExportConstName } from "./abi-export-name";
import { argsInterfaceName } from "./ts-types";

export function generateAbiTs(filteredAbi: AbiFunctionItem[], manifest: ContractManifest): string {
  const name = abiExportConstName(manifest.featureKey);
  return `${autoGenHeader()}export const ${name} = ${JSON.stringify(filteredAbi)} as const;
`;
}

export function generateTypesTs(writeFns: AbiFunctionItem[]): string {
  const exports = writeFns
    .filter((f) => f.inputs.length > 0)
    .map((f) => `export type { ${argsInterfaceName(f.name)} } from "./hooks/use${toHookBaseName(f.name)}";`)
    .join("\n");
  return `${autoGenHeader()}${exports || "export {};\n"}
`;
}

export function generateHooksIndex(
  readFns: AbiFunctionItem[],
  writeFns: AbiFunctionItem[],
): string {
  const lines: string[] = [autoGenHeader()];
  for (const f of readFns) {
    lines.push(`export * from "./use${toHookBaseName(f.name)}";`);
  }
  for (const f of writeFns) {
    lines.push(`export * from "./use${toHookBaseName(f.name)}";`);
  }
  return lines.join("\n") + "\n";
}

export function generateComponentsIndex(writeFns: AbiFunctionItem[]): string {
  const lines: string[] = [autoGenHeader()];
  for (const f of writeFns) {
    if (f.inputs.length === 0) continue;
    lines.push(`export * from "./${toHookBaseName(f.name)}Form";`);
  }
  return lines.join("\n") + "\n";
}

export function generateRootIndex(hasComponents: boolean): string {
  const lines = [
    autoGenHeader().trimEnd(),
    `export * from "./abi";`,
    `export * from "./types";`,
    `export * from "./hooks";`,
  ];
  if (hasComponents) lines.push(`export * from "./components";`);
  return lines.join("\n") + "\n";
}
