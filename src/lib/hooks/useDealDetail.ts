"use client";

// ============================================================
// lib/hooks/useDealDetail.ts
//
// Full detail for one deal token (chain-only). Combines:
//   - TokenRegistry.getToken  → issuer, category, assetType, status
//   - ERC-20 reads on the token → name, symbol, decimals, totalSupply
//   - factory.getDeployedDeal(dealId) → the deployed cluster addresses
//     (dealId = keccak256(name); verified against the token address).
// ============================================================

import { useReadContracts } from "wagmi";
import { useGetToken } from "@/lib/generated/token-registry";
import { useGetDeployedDeal } from "@/lib/generated/factory";
import { dealIdFromName, ZERO_BYTES32 } from "@/lib/contracts/factory-payload";
import type { Address, Hex } from "@/lib/core/types";
import type { DealRecord } from "@/types/deal";

const ZERO_ADDR: Address = "0x0000000000000000000000000000000000000000";

const ERC20_ABI = [
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

type TokenRecord = {
  token: Address;
  deployedAt: bigint;
  delisted: boolean;
  issuer: Address;
  category: Hex;
  assetType: Hex;
};

export function useDealDetail(token: Address | null) {
  const valid = !!token;
  const t = token ?? ZERO_ADDR;

  const rec = useGetToken(undefined, t);
  const record = rec.data as TokenRecord | undefined;
  const found = !!record && record.token !== ZERO_ADDR;

  const meta = useReadContracts({
    contracts: [
      { address: t, abi: ERC20_ABI, functionName: "name" },
      { address: t, abi: ERC20_ABI, functionName: "symbol" },
      { address: t, abi: ERC20_ABI, functionName: "decimals" },
      { address: t, abi: ERC20_ABI, functionName: "totalSupply" },
    ],
    query: { enabled: valid },
  });
  const name = meta.data?.[0]?.result as string | undefined;
  const symbol = meta.data?.[1]?.result as string | undefined;
  const decimals = meta.data?.[2]?.result as number | undefined;
  const totalSupply = meta.data?.[3]?.result as bigint | undefined;

  // Cluster: derive dealId from the on-chain name and verify it maps back
  // to this token (deals created via the wizard use dealId = keccak256(name)).
  const dealId = name ? dealIdFromName(name) : ZERO_BYTES32;
  const dealRead = useGetDeployedDeal(undefined, dealId);
  const clusterRaw = dealRead.data as DealRecord | undefined;
  const cluster =
    clusterRaw && clusterRaw.token?.toLowerCase() === t.toLowerCase() ? clusterRaw : undefined;

  return {
    found,
    record,
    name,
    symbol,
    decimals,
    totalSupply,
    cluster,
    isLoading: rec.isLoading || meta.isLoading || dealRead.isLoading,
    isError: rec.isError,
    refetch: () => {
      rec.refetch();
      meta.refetch();
      dealRead.refetch();
    },
  };
}
