"use client";

// ============================================================
// lib/hooks/useIssuerTokens.ts
//
// Chain-backed list of an issuer's deployed deal tokens. Source of truth
// is TokenRegistry.tokensByIssuer (factory.createDeal registers each
// token there); per token we batch getToken (the registry record) and
// the token's ERC-20 name/symbol/decimals. No DB — see
// docs/platform-contracts.md "chain-only" persistence.
// ============================================================

import { useMemo } from "react";
import { useReadContracts } from "wagmi";
import { useTokensByIssuer, TOKEN_REGISTRY_ABI } from "@/lib/generated/token-registry";
import { useContractAddress } from "@/lib/hooks/useContracts";
import type { Address, Hex } from "@/lib/core/types";

const ZERO: Address = "0x0000000000000000000000000000000000000000";

const ERC20_META_ABI = [
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
] as const;

type TokenRecord = {
  token: Address;
  deployedAt: bigint;
  delisted: boolean;
  issuer: Address;
  category: Hex;
  assetType: Hex;
};

export interface IssuerTokenRow {
  token: Address;
  name?: string;
  symbol?: string;
  decimals?: number;
  category?: Hex;
  assetType?: Hex;
  deployedAt: number; // unix seconds
  delisted: boolean;
}

export function useIssuerTokens(issuer: Address | null | undefined) {
  const registry = useContractAddress("tokenRegistry");
  const list = useTokensByIssuer(undefined, issuer ?? ZERO);
  const tokens = useMemo(() => ((list.data as Address[] | undefined) ?? []), [list.data]);

  const records = useReadContracts({
    contracts: tokens.map((t) => ({
      address: registry ?? undefined,
      abi: TOKEN_REGISTRY_ABI,
      functionName: "getToken",
      args: [t],
    })),
    query: { enabled: !!registry && tokens.length > 0 },
  });

  const meta = useReadContracts({
    contracts: tokens.flatMap((t) => [
      { address: t, abi: ERC20_META_ABI, functionName: "name" },
      { address: t, abi: ERC20_META_ABI, functionName: "symbol" },
      { address: t, abi: ERC20_META_ABI, functionName: "decimals" },
    ]),
    query: { enabled: tokens.length > 0 },
  });

  const rows: IssuerTokenRow[] = useMemo(
    () =>
      tokens.map((t, i) => {
        const rec = records.data?.[i]?.result as TokenRecord | undefined;
        const name = meta.data?.[i * 3]?.result as string | undefined;
        const symbol = meta.data?.[i * 3 + 1]?.result as string | undefined;
        const decimals = meta.data?.[i * 3 + 2]?.result as number | undefined;
        return {
          token: t,
          name,
          symbol,
          decimals,
          category: rec?.category,
          assetType: rec?.assetType,
          deployedAt: rec ? Number(rec.deployedAt) : 0,
          delisted: rec?.delisted ?? false,
        };
      }),
    [tokens, records.data, meta.data],
  );

  return {
    rows,
    isConnected: !!issuer,
    isLoading: list.isLoading || records.isLoading || meta.isLoading,
    isError: list.isError,
    error: list.error as Error | null,
    refetch: () => {
      list.refetch();
      records.refetch();
      meta.refetch();
    },
  };
}
