"use client";

// ============================================================
// app/workspace/tokenized-deposits/page.tsx
// Issuer's tokenized deposit tokens — chain-backed, filtered from the shared
// TokenRegistry by product category (see lib/products/), exactly like the
// stablecoin surface. A tokenized deposit reuses the same platform spine; the
// difference from a stablecoin is POLICY, not plumbing: the issuer is a
// chartered bank, transfers are permissioned (allowlist), and mint/redeem
// settle 1:1 against the core banking ledger via an atomic two-phase commit.
//
// Scaffolded: the deposit cluster (factory / token / settlement adapter) is not
// yet wired, so this reads the live TokenRegistry seam (empty until a deposit
// token is deployed) and documents the model. Issuance lands with the
// settlement adapter. See src/lib/products/registry.ts.
// ============================================================

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Landmark,
  Lock,
  ArrowLeftRight,
  RefreshCw,
  Wallet,
  Inbox,
  ExternalLink,
  Copy,
} from "lucide-react";
import { useWallet } from "@/lib/hooks/useWallet";
import { useContracts } from "@/lib/hooks/useContracts";
import { useIssuerTokens, type IssuerTokenRow } from "@/lib/hooks/useIssuerTokens";
import { productByCategoryHash, getProduct } from "@/lib/products";
import { shortAddress } from "@/lib/contracts/deal-labels";
import { explorerAddressUrl } from "@/lib/explorer-urls";

const DEPOSIT = getProduct("tokenized-deposit");

// The three things that make a deposit token different from a stablecoin —
// same spine, different policy. This is the demo's talking track.
const MODEL = [
  {
    icon: Landmark,
    title: "Bank-issued liability",
    body: "The token is the bank's own deposit — a senior liability on its balance sheet, not a reserve-backed bearer instrument. It changes the rail, not the money.",
  },
  {
    icon: Lock,
    title: "Permissioned transfer",
    body: "ERC-1400-style controlled transfer: only KYB-verified, sanctions-screened, jurisdiction-cleared holders can receive. Enforced on-chain, never bearer.",
  },
  {
    icon: ArrowLeftRight,
    title: "Core-ledger settlement",
    body: "Mint and redeem bind atomically to a posting on the core banking ledger — a two-phase commit across the two ledgers, reconciled 1:1 so supply can never diverge.",
  },
];

export default function TokenizedDepositsPage() {
  const { address } = useWallet();
  const { chainId, tokenRegistry } = useContracts();
  const { rows, isLoading, isError, refetch } = useIssuerTokens(address);

  const deposits = useMemo(
    () =>
      rows
        .filter((r) => productByCategoryHash(r.category)?.key === "tokenized-deposit")
        .sort((a, b) => b.deployedAt - a.deployedAt),
    [rows],
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Tokenized Deposits</h1>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              Scaffolded
            </Badge>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">{DEPOSIT.tagline}</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* The model — how a deposit token differs from a stablecoin */}
      <div className="grid gap-3 sm:grid-cols-3">
        {MODEL.map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardContent className="space-y-2 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Body — live TokenRegistry seam (shared with every other product) */}
      {!address ? (
        <EmptyState icon={Wallet} title="Connect your wallet" hint="Connect the issuer wallet to see deposit tokens registered to this bank." />
      ) : !tokenRegistry ? (
        <EmptyState
          icon={Inbox}
          title="Network not configured"
          hint={`TokenRegistry isn't configured for chain ${chainId}. Switch your wallet to Sepolia (11155111).`}
        />
      ) : isLoading && rows.length === 0 ? (
        <TableShell><SkeletonRows /></TableShell>
      ) : deposits.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No deposit tokens yet"
          hint="Deposit tokens issued by this bank will appear here — read from the same shared TokenRegistry as every other asset class. Issuance lands with the core-ledger settlement adapter."
        />
      ) : (
        <TableShell>
          {deposits.map((r) => (
            <DepositRow key={r.token} row={r} chainId={chainId} />
          ))}
        </TableShell>
      )}

      <p className="text-xs text-muted-foreground">
        {deposits.length} deposit token{deposits.length === 1 ? "" : "s"} · read live from TokenRegistry
        {" · "}reuses the shared platform spine — same identity, custody, registry and AccessManager as every product
      </p>
      {isError && (
        <p className="text-xs text-destructive">
          Couldn&apos;t read from the network — check your connection and hit Refresh.
        </p>
      )}
    </div>
  );
}

// ─── Table shell ──────────────────────────────────────────────
function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deposit token</TableHead>
            <TableHead>Deployed</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Token</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────
function DepositRow({ row, chainId }: { row: IssuerTokenRow; chainId: number }) {
  const explorer = explorerAddressUrl(chainId, row.token);
  const deployed = row.deployedAt
    ? new Date(row.deployedAt * 1000).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "—";

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Landmark className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{row.name || "Untitled deposit token"}</p>
            <p className="font-mono text-xs text-muted-foreground">{row.symbol || shortAddress(row.token)}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{deployed}</TableCell>
      <TableCell>
        {row.delisted ? (
          <Badge variant="secondary" className="text-muted-foreground">Delisted</Badge>
        ) : (
          <Badge className="border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Listed</Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs">{shortAddress(row.token)}</span>
          <CopyButton value={row.token} />
        </div>
      </TableCell>
      <TableCell className="text-right">
        {explorer && (
          <Button variant="ghost" size="sm" asChild>
            <a href={explorer} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="sr-only">View on explorer</span>
            </a>
          </Button>
        )}
      </TableCell>
    </TableRow>
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

// ─── States ───────────────────────────────────────────────────
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 5 }).map((__, j) => (
            <TableCell key={j}><div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-muted" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ElementType;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 max-w-md text-sm text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}
