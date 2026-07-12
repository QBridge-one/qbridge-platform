"use client";

// ============================================================
// app/workspace/tokenized-deposits/[token]/page.tsx
// Deposit-token detail — the control surface for one deposit token instance.
// [token] = token address. Scaffolded: there is no deposit factory / token
// contract / settlement adapter yet, so this is read-only — it presents the
// Manage surface (Identity/allowlist + Settlement) without live on-chain
// writes. Mirrors the stablecoin detail page, minus proof-of-reserves (a
// deposit is a bank liability settled 1:1 to core banking, not reserve-backed).
// ============================================================

import { useParams } from "next/navigation";
import Link from "next/link";
import { isAddress } from "viem";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Landmark, Copy, ExternalLink } from "lucide-react";
import { useContracts } from "@/lib/hooks/useContracts";
import { TokenizedDepositManagePanel } from "./_components/manage-panel";
import { shortAddress } from "@/lib/contracts/deal-labels";
import { explorerAddressUrl } from "@/lib/explorer-urls";
import type { Address } from "@/lib/core/types";

export default function TokenizedDepositDetailPage() {
  const params = useParams<{ token: string }>();
  const raw = params?.token ?? "";
  const valid = isAddress(raw);
  const token = (valid ? raw : null) as Address | null;

  const { chainId } = useContracts();

  return (
    <div className="space-y-6 p-6">
      {/* Back */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/workspace/tokenized-deposits">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Tokenized Deposits
          </Link>
        </Button>
      </div>

      {!valid || !token ? (
        <Empty title="Invalid address" hint="This URL isn't a valid token address." />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Landmark className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Deposit token</h1>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">Scaffolded</Badge>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="font-mono text-xs text-muted-foreground">{token}</span>
                <CopyButton value={token} />
                {explorerAddressUrl(chainId, token) && (
                  <a
                    href={explorerAddressUrl(chainId, token)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Cluster addresses — pending until the deposit cluster is wired */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contracts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <AddressRow label="Token" address={token} chainId={chainId} />
              <AddressRow label="Compliance checker" address={null} chainId={chainId} />
              <AddressRow label="Identity registry" address={null} chainId={chainId} />
              <AddressRow label="Settlement adapter" address={null} chainId={chainId} />
            </CardContent>
          </Card>

          {/* Control surface (read-only until the cluster is wired) */}
          <TokenizedDepositManagePanel token={token} />
        </>
      )}
    </div>
  );
}

// ─── Pieces ───────────────────────────────────────────────────
function AddressRow({
  label,
  address,
  chainId,
}: {
  label: string;
  address: Address | null;
  chainId: number;
}) {
  const explorer = address ? explorerAddressUrl(chainId, address) : null;
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-xs">{address ? shortAddress(address) : "— (pending)"}</span>
        {address && <CopyButton value={address} />}
        {explorer && (
          <a href={explorer} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(value)}
      className="text-muted-foreground transition-colors hover:text-foreground"
      title="Copy address"
    >
      <Copy className="h-3 w-3" />
    </button>
  );
}

function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
