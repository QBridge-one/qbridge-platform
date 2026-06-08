"use client";

// Real "Total Assets" stat for the issuer overview — counts deployed
// deal tokens from TokenRegistry (replaces the mock count).

import { Coins } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { useWallet } from "@/lib/hooks/useWallet";
import { useIssuerTokens } from "@/lib/hooks/useIssuerTokens";

export function TotalAssetsStat() {
  const { address } = useWallet();
  const { rows, isLoading } = useIssuerTokens(address);
  const listed = rows.filter((r) => !r.delisted).length;

  return (
    <StatCard
      title="Total Assets"
      value={address ? rows.length : "—"}
      subtitle={address ? `${listed} listed` : "Connect wallet"}
      icon={Coins}
      loading={!!address && isLoading && rows.length === 0}
    />
  );
}
