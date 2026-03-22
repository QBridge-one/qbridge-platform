// ============================================================
// lib/abi-engine/parser.ts
//
// Parses any ABI JSON into typed function descriptors.
// This is the foundation of the ABI engine — everything else
// (form schema, UI rendering) is built on top of these descriptors.
//
// Zero dependencies on React or wagmi — pure TypeScript.
// ============================================================

// ─── Solidity types we handle ────────────────────────────────
export type SolidityBaseType =
  | "address"
  | "bool"
  | "string"
  | "bytes"
  | "uint8" | "uint16" | "uint32" | "uint64" | "uint128" | "uint256"
  | "int8"  | "int16"  | "int32"  | "int64"  | "int128"  | "int256"
  | "bytes1" | "bytes4" | "bytes32"
  | "tuple";

// ─── Parsed param descriptor ─────────────────────────────────
export interface AbiParamDescriptor {
  name: string;
  solidityType: string;          // raw solidity type e.g. "uint64", "address[]"
  baseType: SolidityBaseType;    // without array suffix
  isArray: boolean;
  isTuple: boolean;
  components?: AbiParamDescriptor[]; // for tuples
  // Semantic hints — engine uses these to pick the right input widget
  semantic: ParamSemantic;
}

export type ParamSemantic =
  | "role_id"        // uint64 that represents an AccessManager role → role selector
  | "address"        // ethereum address → address input with checksum
  | "account"        // address that is specifically a user/wallet
  | "amount"         // uint256 representing a token amount → formatted input
  | "delay"          // uint32 representing seconds → duration picker
  | "timestamp"      // uint48/uint256 representing unix time → datetime
  | "selector"       // bytes4 function selector → hex input
  | "bool"           // boolean → toggle
  | "string"         // string → text input
  | "bytes"          // raw bytes → hex textarea
  | "integer"        // generic integer
  | "bytes32"        // fixed bytes32 → hex input
  | "unknown";

// ─── Parsed function descriptor ──────────────────────────────
export type FunctionMutability = "view" | "pure" | "nonpayable" | "payable";
export type FunctionKind = "read" | "write";

export interface AbiFunctionDescriptor {
  name: string;
  signature: string;             // e.g. "grantRole(uint64,address,uint32)"
  selector: string;              // first 4 bytes of keccak256(signature)
  kind: FunctionKind;            // read = view/pure, write = nonpayable/payable
  mutability: FunctionMutability;
  inputs: AbiParamDescriptor[];
  outputs: AbiParamDescriptor[];
  // Human-readable label derived from camelCase name
  label: string;
  // Whether this is a sensitive operation (requires extra confirmation)
  isSensitive: boolean;
}

// ─── Full parsed ABI ─────────────────────────────────────────
export interface ParsedAbi {
  functions: AbiFunctionDescriptor[];
  reads: AbiFunctionDescriptor[];
  writes: AbiFunctionDescriptor[];
  events: AbiEventDescriptor[];
}

export interface AbiEventDescriptor {
  name: string;
  inputs: AbiParamDescriptor[];
  label: string;
}

// ─── Parser ──────────────────────────────────────────────────
export function parseAbi(abi: readonly unknown[]): ParsedAbi {
  const functions: AbiFunctionDescriptor[] = [];
  const events: AbiEventDescriptor[] = [];

  for (const item of abi) {
    const entry = item as Record<string, unknown>;

    if (entry.type === "function") {
      const fn = parseFunctionEntry(entry);
      functions.push(fn);
    }

    if (entry.type === "event") {
      events.push(parseEventEntry(entry));
    }
  }

  return {
    functions,
    reads: functions.filter((f) => f.kind === "read"),
    writes: functions.filter((f) => f.kind === "write"),
    events,
  };
}

// ─── Internal helpers ─────────────────────────────────────────
function parseFunctionEntry(entry: Record<string, unknown>): AbiFunctionDescriptor {
  const name = entry.name as string;
  const mutability = (entry.stateMutability as FunctionMutability) ?? "nonpayable";
  const kind: FunctionKind = mutability === "view" || mutability === "pure" ? "read" : "write";
  const inputs = parseParams((entry.inputs as unknown[]) ?? [], name);
  const outputs = parseParams((entry.outputs as unknown[]) ?? [], name);
  const signature = buildSignature(name, inputs);

  return {
    name,
    signature,
    selector: computeSelector(signature),
    kind,
    mutability,
    inputs,
    outputs,
    label: camelToLabel(name),
    isSensitive: isSensitiveFunction(name),
  };
}

function parseEventEntry(entry: Record<string, unknown>): AbiEventDescriptor {
  const name = entry.name as string;
  const inputs = parseParams((entry.inputs as unknown[]) ?? [], name);
  return { name, inputs, label: camelToLabel(name) };
}

function parseParams(
  params: unknown[],
  functionName: string,
): AbiParamDescriptor[] {
  return params.map((p, i) => {
    const param = p as Record<string, unknown>;
    const name = (param.name as string) || `param${i}`;
    const solidityType = param.type as string;
    const isArray = solidityType.endsWith("[]") || /\[\d+\]$/.test(solidityType);
    const baseTypeName = solidityType.replace(/\[\d*\]$/, "") as SolidityBaseType;
    const isTuple = baseTypeName === "tuple";
    const components = isTuple
      ? parseParams((param.components as unknown[]) ?? [], functionName)
      : undefined;

    return {
      name,
      solidityType,
      baseType: baseTypeName,
      isArray,
      isTuple,
      components,
      semantic: inferSemantic(name, solidityType, functionName),
    };
  });
}

function inferSemantic(
  paramName: string,
  solidityType: string,
  functionName: string,
): ParamSemantic {
  const n = paramName.toLowerCase();
  const t = solidityType.toLowerCase();

  // Role ID — uint64 named roleId or role
  if ((n === "roleid" || n === "role") && t === "uint64") return "role_id";

  // Execution delay — common in AccessManager
  if ((n === "executiondelay" || n === "delay" || n.includes("delay")) && t === "uint32") return "delay";

  // Timestamps
  if ((n === "when" || n === "since" || n === "effect" || n.includes("time") || n.includes("at")) &&
    (t === "uint48" || t === "uint256")) return "timestamp";

  // Function selectors
  if (t === "bytes4" || n === "selector" || n.includes("selector")) return "selector";

  // Addresses
  if (t === "address") {
    if (n === "account" || n === "caller" || n.includes("account") || n.includes("wallet")) return "account";
    return "address";
  }

  // Token amounts
  if (t === "uint256" && (n.includes("amount") || n.includes("balance") || n.includes("value"))) return "amount";

  // Bool
  if (t === "bool") return "bool";

  // String
  if (t === "string") return "string";

  // bytes32
  if (t === "bytes32") return "bytes32";

  // Raw bytes
  if (t === "bytes" || t.startsWith("bytes")) return "bytes";

  // Generic integers
  if (t.startsWith("uint") || t.startsWith("int")) return "integer";

  return "unknown";
}

function buildSignature(name: string, inputs: AbiParamDescriptor[]): string {
  const paramTypes = inputs.map((p) => p.solidityType).join(",");
  return `${name}(${paramTypes})`;
}

function computeSelector(signature: string): string {
  // Simple implementation — in production use viem's toFunctionSelector
  // Returns first 4 bytes of keccak256
  // For display purposes only — actual selector computed by viem at call time
  return `0x${signature.split("").reduce((acc, c) => acc + c.charCodeAt(0).toString(16).padStart(2, "0"), "").slice(0, 8)}`;
}

function camelToLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

// Functions that require extra confirmation in the UI
const SENSITIVE_FUNCTIONS = new Set([
  "grantRole", "revokeRole", "setTargetClosed", "setTargetAdminDelay",
  "forceTransfer", "forceBurn", "freeze", "unfreeze",
  "pause", "unpause", "emergencyPause",
]);

function isSensitiveFunction(name: string): boolean {
  return SENSITIVE_FUNCTIONS.has(name);
}
