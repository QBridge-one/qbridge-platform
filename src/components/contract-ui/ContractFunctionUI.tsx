"use client";

// ============================================================
// components/contract-ui/ContractFunctionUI.tsx
//
// The top-level ABI engine component.
// Takes a contract address + ABI + optional function filter
// and renders all write functions as forms automatically.
//
// This is what you use in the AccessManagerPanel and any
// future contract integration — one component, zero boilerplate.
//
// Usage — render ALL write functions:
//   <ContractFunctionUI
//     contractAddress={platformAMAddress}
//     abi={PlatformAccessManagerABI}
//     chainId={chainId}
//     roles={config.roles}
//   />
//
// Usage — render SPECIFIC functions only:
//   <ContractFunctionUI
//     contractAddress={platformAMAddress}
//     abi={PlatformAccessManagerABI}
//     chainId={chainId}
//     roles={config.roles}
//     only={["grantRole", "revokeRole", "renounceRole"]}
//   />
//
// Usage — render ONE function:
//   <ContractFunctionUI
//     contractAddress={platformAMAddress}
//     abi={PlatformAccessManagerABI}
//     chainId={chainId}
//     roles={config.roles}
//     only={["grantRole"]}
//     onSuccess={() => refetch()}
//   />
// ============================================================

import { useMemo } from "react";
import { parseAbi } from "@/lib/abi-engine/parser";
import type { RoleDefinition } from "@/types/access-manager";
import type { Address } from "@/lib/core/types";
import { ContractFunctionForm } from "./ContractFunctionForm";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

// Optional metadata per function — human labels, descriptions
// If not provided, labels are derived from function names automatically
export interface FunctionMeta {
  [functionName: string]: {
    label?: string;
    description?: string;
    hidden?: boolean;
  };
}

interface ContractFunctionUIProps {
  contractAddress: Address;
  abi: readonly unknown[];
  chainId: number;
  roles?: RoleDefinition[];
  // Filter to specific functions — if omitted, all writes are shown
  only?: string[];
  // Hide specific functions
  exclude?: string[];
  // Optional per-function metadata
  meta?: FunctionMeta;
  // Callbacks
  onSuccess?: (functionName: string, hash: string) => void;
  onError?: (functionName: string, error: Error) => void;
  // Layout: "accordion" (default) or "flat" (all forms visible at once)
  layout?: "accordion" | "flat";
}

export function ContractFunctionUI({
  contractAddress,
  abi,
  chainId,
  roles,
  only,
  exclude = [],
  meta = {},
  onSuccess,
  onError,
  layout = "accordion",
}: ContractFunctionUIProps) {
  const parsed = useMemo(() => parseAbi(abi), [abi]);

  const functions = useMemo(() => {
    let fns = parsed.writes;

    // Filter to "only" list if provided
    if (only && only.length > 0) {
      fns = fns.filter((f) => only.includes(f.name));
      // Preserve order from "only" array
      fns.sort((a, b) => only.indexOf(a.name) - only.indexOf(b.name));
    }

    // Apply exclusions
    fns = fns.filter((f) => !exclude.includes(f.name));

    // Apply hidden flag from meta
    fns = fns.filter((f) => !meta[f.name]?.hidden);

    return fns;
  }, [parsed, only, exclude, meta]);

  if (functions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No write functions to display.
      </p>
    );
  }

  if (layout === "flat") {
    return (
      <div className="space-y-8">
        {functions.map((fn) => (
          <ContractFunctionForm
            key={fn.name}
            fn={{ ...fn, label: meta[fn.name]?.label ?? fn.label }}
            contractAddress={contractAddress}
            abi={abi}
            chainId={chainId}
            roles={roles}
            description={meta[fn.name]?.description}
            onSuccess={(hash) => onSuccess?.(fn.name, hash)}
            onError={(err) => onError?.(fn.name, err)}
          />
        ))}
      </div>
    );
  }

  // Default: accordion layout — one form per accordion item
  return (
    <Accordion type="single" collapsible className="w-full">
      {functions.map((fn) => (
        <AccordionItem key={fn.name} value={fn.name}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 text-left">
              <span className="text-sm font-medium">
                {meta[fn.name]?.label ?? fn.label}
              </span>
              {fn.isSensitive && (
                <Badge variant="destructive" className="text-xs">Sensitive</Badge>
              )}
              <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                {fn.name}({fn.inputs.map((i) => i.solidityType).join(", ")})
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            {meta[fn.name]?.description && (
              <p className="text-xs text-muted-foreground mb-4">
                {meta[fn.name].description}
              </p>
            )}
            <ContractFunctionForm
              fn={{ ...fn, label: meta[fn.name]?.label ?? fn.label }}
              contractAddress={contractAddress}
              abi={abi}
              chainId={chainId}
              roles={roles}
              onSuccess={(hash) => onSuccess?.(fn.name, hash)}
              onError={(err) => onError?.(fn.name, err)}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
