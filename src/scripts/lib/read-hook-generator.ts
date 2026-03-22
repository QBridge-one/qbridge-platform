import type { AbiFunctionItem } from "./abi-resolver";
import type { ContractManifest } from "./manifest-schema";
import { autoGenHeader, toHookBaseName } from "./code-writer";
import { abiExportConstName } from "./abi-export-name";
import { solTypeToTs } from "./ts-types";

function paramName(name: string | undefined, i: number): string {
  if (name && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return name;
  return `arg${i}`;
}

export function generateReadHookFile(fn: AbiFunctionItem, manifest: ContractManifest): string {
  const hookName = `use${toHookBaseName(fn.name)}`;
  const abiConst = abiExportConstName(manifest.featureKey);
  const pnames = fn.inputs.map((inp, i) => paramName(inp.name, i));
  const paramList = [
    "contractAddress: Address | null | undefined",
    ...fn.inputs.map((inp, i) => `${paramName(inp.name, i)}: ${solTypeToTs(inp.type)}`),
    "chainId?: number",
  ];

  const argsArray =
    fn.inputs.length === 0 ? "[]" : `[${pnames.map((p) => p).join(", ")}]`;
  const argsLine =
    fn.inputs.length === 0
      ? ""
      : `
    args: ${argsArray},`;

  return `${autoGenHeader()}"use client";

import { useReadContract, useChainId } from "wagmi";
import { useContractAddress } from "../../../hooks/useContracts";
import type { Address } from "../../../core/types";
import { ${abiConst} } from "../abi";

export function ${hookName}(
  ${paramList.join(",\n  ")}
) {
  const registryAddress = useContractAddress("${manifest.contractAddressKey}") as Address | null;
  const address = (contractAddress ?? registryAddress) ?? undefined;
  const wagmiChainId = useChainId();
  const resolvedChainId = chainId ?? wagmiChainId;

  return useReadContract({
    address,
    abi: ${abiConst},
    functionName: "${fn.name}",${argsLine}
    chainId: resolvedChainId,
    query: { enabled: !!address },
  });
}
`;
}
