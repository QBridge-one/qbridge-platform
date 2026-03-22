import type { AbiFunctionItem } from "./abi-resolver";
import type { ContractManifest } from "./manifest-schema";
import { autoGenHeader, toHookBaseName } from "./code-writer";
import { abiExportConstName } from "./abi-export-name";
import { argsInterfaceName, solTypeToTs } from "./ts-types";

function paramName(name: string | undefined, i: number): string {
  if (name && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return name;
  return `arg${i}`;
}

export function generateWriteHookFile(fn: AbiFunctionItem, manifest: ContractManifest): string {
  const hookName = `use${toHookBaseName(fn.name)}`;
  const methodName = fn.name;
  const abiConst = abiExportConstName(manifest.featureKey);
  const iface = argsInterfaceName(fn.name);
  const ifaceBody =
    fn.inputs.length === 0
      ? "Record<string, never>"
      : `{\n${fn.inputs.map((inp, i) => `  ${paramName(inp.name, i)}: ${solTypeToTs(inp.type)};`).join("\n")}\n}`;

  const argsFields = fn.inputs.map((inp, i) => paramName(inp.name, i));
  const argsArray =
    fn.inputs.length === 0 ? "[]" : `[${argsFields.map((f) => `args.${f}`).join(", ")}]`;
  const writeParams = fn.inputs.length === 0 ? "" : `args: ${iface}`;

  return `${autoGenHeader()}"use client";

import { useCallback, useState } from "react";
import { useChainId } from "wagmi";
import { transactionService } from "../../../container";
import { useContractAddress } from "../../../hooks/useContracts";
import type { Address } from "../../../core/types";
import { ${abiConst} } from "../abi";

export type ${iface} = ${ifaceBody};

export function ${hookName}() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const contractAddress = useContractAddress("${manifest.contractAddressKey}") as Address | null;
  const chainId = useChainId();

  const ${methodName} = useCallback(
    async (${writeParams}) => {
      if (!contractAddress) {
        const err = new Error("Contract address is not configured for this chain.");
        setError(err);
        throw err;
      }
      setIsLoading(true);
      setError(null);
      try {
        const result = await transactionService.execute({
          contractCall: {
            address: contractAddress,
            abi: ${abiConst},
            functionName: "${fn.name}",
            args: ${argsArray},
            chainId,
          },
        });
        if (result.status === "failed" && result.error) {
          setError(result.error);
          throw result.error;
        }
        return result.hash;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, chainId],
  );

  const reset = useCallback(() => setError(null), []);

  return { ${methodName}, isLoading, error, reset };
}
`;
}
