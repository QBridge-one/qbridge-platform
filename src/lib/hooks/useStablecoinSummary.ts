"use client";

// ============================================================
// lib/hooks/useStablecoinSummary.ts
//
// Read-only, chain-backed snapshot of one stablecoin instance: its
// ERC-20 metadata + the proof-of-reserves state that gates issuance.
// Composes the generated stablecoin-token + reserve-oracle read hooks
// (the token tells us its oracle; we then read the oracle directly).
//
// Pass an explicit token address — the reference/demo instance falls back
// to the registry-wired address only when none is given.
// ============================================================

import {
  useName,
  useSymbol,
  useDecimals,
  useTotalSupply,
  useMintableHeadroom,
  useReserveOracle,
  useComplianceChecker,
  useIdentityRegistry,
  useMaxReserveAttestationAge,
  usePaused,
} from "@/lib/generated/stablecoin-token";
import {
  useAttestedReserves,
  useIsStale,
  useGetLatestAttestationId,
} from "@/lib/generated/reserve-oracle";
import type { Address } from "@/lib/core/types";

export interface StablecoinSummary {
  token: Address | null;
  oracle: Address | null;
  compliance: Address | null;
  identity: Address | null;
  name?: string;
  symbol?: string;
  decimals?: number;
  paused?: boolean;
  totalSupply?: bigint;
  attestedReserves?: bigint;
  mintableHeadroom?: bigint;
  /** Reserve freshness window in seconds (0 = staleness gate disabled). */
  maxAttestationAge?: bigint;
  /** True when the latest attestation is older than the freshness window. */
  reservesStale?: boolean;
  /** Whether any reserve attestation has landed yet. */
  hasAttestation: boolean;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useStablecoinSummary(token: Address | null): StablecoinSummary {
  const name = useName(token);
  const symbol = useSymbol(token);
  const decimals = useDecimals(token);
  const paused = usePaused(token);
  const totalSupply = useTotalSupply(token);
  const headroom = useMintableHeadroom(token);
  const maxAge = useMaxReserveAttestationAge(token);
  const oracleRead = useReserveOracle(token);
  const complianceRead = useComplianceChecker(token);
  const identityRead = useIdentityRegistry(token);

  const oracle = (oracleRead.data as Address | undefined) ?? null;
  const compliance = (complianceRead.data as Address | undefined) ?? null;
  const identity = (identityRead.data as Address | undefined) ?? null;

  const reserves = useAttestedReserves(oracle);
  const latestId = useGetLatestAttestationId(oracle);
  const maxAgeVal = maxAge.data as bigint | undefined;
  // isStale needs a window; when the token disables the gate (0) the staleness
  // result is not meaningful, so we read with a harmless 0 and ignore it below.
  const stale = useIsStale(oracle, maxAgeVal ?? BigInt(0));

  const latestIdVal = latestId.data as bigint | undefined;
  const hasAttestation = latestIdVal !== undefined && latestIdVal > BigInt(0);
  const staleTuple = stale.data as readonly [boolean, bigint] | undefined;
  const reservesStale =
    maxAgeVal && maxAgeVal > BigInt(0) && staleTuple ? staleTuple[0] : false;

  return {
    token,
    oracle,
    compliance,
    identity,
    name: name.data as string | undefined,
    symbol: symbol.data as string | undefined,
    decimals: decimals.data as number | undefined,
    paused: paused.data as boolean | undefined,
    totalSupply: totalSupply.data as bigint | undefined,
    attestedReserves: reserves.data as bigint | undefined,
    mintableHeadroom: headroom.data as bigint | undefined,
    maxAttestationAge: maxAgeVal,
    reservesStale,
    hasAttestation,
    isLoading:
      name.isLoading ||
      symbol.isLoading ||
      decimals.isLoading ||
      totalSupply.isLoading ||
      oracleRead.isLoading ||
      reserves.isLoading,
    isError:
      name.isError ||
      totalSupply.isError ||
      oracleRead.isError ||
      reserves.isError,
    refetch: () => {
      name.refetch();
      symbol.refetch();
      decimals.refetch();
      paused.refetch();
      totalSupply.refetch();
      headroom.refetch();
      maxAge.refetch();
      oracleRead.refetch();
      complianceRead.refetch();
      identityRead.refetch();
      reserves.refetch();
      latestId.refetch();
      stale.refetch();
    },
  };
}
