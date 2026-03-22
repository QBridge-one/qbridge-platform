/** Map Solidity ABI param types to TypeScript types for generated args interfaces. */
export function solTypeToTs(type: string): string {
  const base = type.replace(/\[\]$/, "");
  const isArr = type.endsWith("[]");
  const inner = (): string => {
    if (base === "address") return "`0x${string}`";
    if (base === "bool") return "boolean";
    if (base === "string") return "string";
    if (base === "bytes" || base === "bytes4" || base === "bytes32") return "`0x${string}`";
    if (base.startsWith("uint")) {
      const bits = parseInt(base.replace(/^uint/, ""), 10);
      if (!Number.isFinite(bits) || bits === 0) return "bigint";
      if (bits <= 32) return "number";
      return "bigint";
    }
    if (base.startsWith("int")) return "bigint";
    return "unknown";
  };
  if (isArr) return `readonly (${inner()})[]`;
  return inner();
}

export function argsInterfaceName(functionName: string): string {
  return `${functionName.charAt(0).toUpperCase()}${functionName.slice(1)}Args`;
}
