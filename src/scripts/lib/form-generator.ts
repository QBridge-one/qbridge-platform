import type { AbiFunctionItem } from "./abi-resolver";
import type { ContractManifest, FunctionOverride } from "./manifest-schema";
import { autoGenHeader, toHookBaseName, toPascalCase } from "./code-writer";
import { argsInterfaceName, solTypeToTs } from "./ts-types";

function paramName(name: string | undefined, i: number): string {
  if (name && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return name;
  return `arg${i}`;
}

function buildCoercion(fn: AbiFunctionItem): string {
  const lines: string[] = [];
  for (let i = 0; i < fn.inputs.length; i++) {
    const inp = fn.inputs[i];
    const p = paramName(inp.name, i);
    const t = inp.type;
    if (t === "address" || t === "bytes4" || t === "bytes32" || t === "bytes") {
      lines.push(`    ${p}: ${p}.trim() as \`0x\${string}\`,`);
    } else if (t === "bool") {
      lines.push(`    ${p}: ${p} === "true" || ${p} === "1",`);
    } else if (t === "string") {
      lines.push(`    ${p}: ${p},`);
    } else if (t.endsWith("[]") && t.startsWith("bytes4")) {
      lines.push(
        `    ${p}: ${p}.split(/[\\s,]+/).filter(Boolean) as readonly \`0x\${string}\`[],`,
      );
    } else if (t.endsWith("[]")) {
      lines.push(`    ${p}: JSON.parse(${p}) as ${solTypeToTs(t)},`);
    } else if (t.startsWith("uint") || t.startsWith("int")) {
      const bits = parseInt(t.replace(/^(uint|int)/, ""), 10);
      if (Number.isFinite(bits) && bits <= 32 && t.startsWith("uint")) {
        lines.push(`    ${p}: Number(${p}),`);
      } else {
        lines.push(`    ${p}: BigInt(${p}),`);
      }
    } else {
      lines.push(`    ${p}: ${p} as ${solTypeToTs(t)},`);
    }
  }
  return lines.join("\n");
}

export function generateFormComponent(
  fn: AbiFunctionItem,
  manifest: ContractManifest,
): string {
  const override: FunctionOverride | undefined = manifest.functions.overrides?.[fn.name];
  const title = override?.displayName ?? toHookBaseName(fn.name);
  const desc = override?.description ?? "";
  const dangerous = override?.dangerous ? true : false;
  const compName = `${toHookBaseName(fn.name)}Form`;
  const hookName = `use${toHookBaseName(fn.name)}`;
  const iface = argsInterfaceName(fn.name);
  const methodName = fn.name;

  const fields = fn.inputs.map((inp, i) => {
    const p = paramName(inp.name, i);
    const label =
      override?.paramLabels?.[inp.name] ??
      override?.paramLabels?.[p] ??
      (inp.name || p);
    const placeholder =
      inp.type.includes("[]") && inp.type.startsWith("bytes4")
        ? "0x..., 0x..."
        : inp.type.includes("[]")
          ? 'JSON array e.g. ["0x..."]'
          : inp.type.startsWith("uint")
            ? "numeric string"
            : "";
    return `
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="${p}">
          ${label}
        </label>
        <input
          id="${p}"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={${p}}
          onChange={(e) => set${toPascalCase(p)}(e.target.value)}
          placeholder="${placeholder}"
          disabled={isLoading}
        />
      </div>`;
  });

  const stateDecls = fn.inputs
    .map((inp, i) => {
      const p = paramName(inp.name, i);
      return `const [${p}, set${toPascalCase(p)}] = useState("");`;
    })
    .join("\n  ");

  const coerceBlock = buildCoercion(fn);

  const dangerClass = dangerous ? " border-destructive/50" : "";

  return `${autoGenHeader()}"use client";

import { useState } from "react";
import { ${hookName} } from "../hooks/${hookName}";
import type { ${iface} } from "../hooks/${hookName}";

export function ${compName}() {
  const { ${methodName}, isLoading, error, reset } = ${hookName}();
  ${stateDecls}

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload: ${iface} = {
${coerceBlock}
      };
      await ${methodName}(payload);
    } catch {
      /* surfaced via error state */
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={"space-y-4 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm${dangerClass}"}
    >
      <div>
        <h3 className="text-lg font-semibold">${title}</h3>
        ${desc ? `<p className="text-sm text-muted-foreground">${desc.replace(/`/g, "\\`")}</p>` : ""}
      </div>
      ${fields.join("\n")}
      {error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          {isLoading ? "Submitting…" : "Submit"}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            ${fn.inputs.map((inp, i) => `set${toPascalCase(paramName(inp.name, i))}("");`).join("\n            ")}
          }}
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
`;
}
