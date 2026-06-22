"use client";

// ============================================================
// app/workspace/stablecoins/[token]/_components/manage-panel.tsx
//
// Operate actions for ONE stablecoin instance: attest reserves, issue,
// fulfil/cancel redemptions, freeze/unfreeze. Address-parametrized (the
// token/oracle being viewed) via useStablecoinAdminAction — same tx path
// + generated ABIs as the codegen forms, but pointed at this instance.
//
// All actions are AccessManager-role-gated on-chain; a wallet without the
// role gets a decoded revert here.
// ============================================================

import { useState } from "react";
import { parseUnits } from "viem";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Settings2 } from "lucide-react";
import { useStablecoinAdminAction } from "@/lib/hooks/useStablecoinAdmin";
import { STABLECOIN_TOKEN_ABI } from "@/lib/generated/stablecoin-token";
import { RESERVE_ORACLE_ABI } from "@/lib/generated/reserve-oracle";
import { toBytes32Label, ZERO_BYTES32 } from "@/lib/contracts/stablecoin-payload";
import type { Address, Hex } from "@/lib/core/types";

interface Props {
  token: Address;
  oracle: Address | null;
  decimals?: number;
  symbol?: string;
  onChanged?: () => void;
}

/** Human token amount → base units. Throws a friendly error on bad input. */
function toBaseUnits(amount: string, decimals: number): bigint {
  const v = amount.trim();
  if (!v || !/^\d*\.?\d+$/.test(v)) throw new Error("Enter a valid amount.");
  return parseUnits(v as `${number}`, decimals);
}

/** Free text → bytes32 reference: 32-byte hex passes through, else keccak, else zero. */
function toReference(text: string): Hex {
  const v = text.trim();
  if (!v) return ZERO_BYTES32;
  return toBytes32Label(v);
}

export function StablecoinManagePanel({ token, oracle, decimals, symbol, onChanged }: Props) {
  const dec = decimals ?? 6;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="h-4 w-4 text-primary" />
          Manage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="reserves">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reserves">Reserves</TabsTrigger>
            <TabsTrigger value="issue">Issue</TabsTrigger>
            <TabsTrigger value="redeem">Redeem</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="reserves" className="pt-4">
            <AttestReservesForm oracle={oracle} dec={dec} symbol={symbol} onChanged={onChanged} />
          </TabsContent>
          <TabsContent value="issue" className="pt-4">
            <IssueForm token={token} dec={dec} symbol={symbol} onChanged={onChanged} />
          </TabsContent>
          <TabsContent value="redeem" className="pt-4">
            <RedemptionForm token={token} dec={dec} symbol={symbol} onChanged={onChanged} />
          </TabsContent>
          <TabsContent value="compliance" className="pt-4">
            <ComplianceForm token={token} onChanged={onChanged} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ─── Shared form chrome ───────────────────────────────────────
function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={mono ? "font-mono text-xs" : ""}
      />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Status({
  isLoading,
  error,
  hash,
  label,
  disabled,
  onSubmit,
}: {
  isLoading: boolean;
  error: Error | null;
  hash: Hex | null;
  label: string;
  disabled?: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {hash && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> Submitted — tx <code className="font-mono text-xs">{hash.slice(0, 10)}…</code>
        </p>
      )}
      <Button onClick={onSubmit} disabled={isLoading || disabled}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {label}
      </Button>
    </div>
  );
}

// ─── Attest reserves (oracle) ─────────────────────────────────
function AttestReservesForm({
  oracle,
  dec,
  symbol,
  onChanged,
}: {
  oracle: Address | null;
  dec: number;
  symbol?: string;
  onChanged?: () => void;
}) {
  const { run, isLoading, error, hash, reset } = useStablecoinAdminAction();
  const [amount, setAmount] = useState("");
  const [reportURI, setReportURI] = useState("");
  const [note, setNote] = useState("");
  const [local, setLocal] = useState<string | null>(null);

  const submit = async () => {
    setLocal(null);
    reset();
    if (!oracle) {
      setLocal("Reserve oracle address unavailable.");
      return;
    }
    let reserveAmount: bigint;
    try {
      reserveAmount = toBaseUnits(amount, dec);
    } catch (e) {
      setLocal((e as Error).message);
      return;
    }
    // asOf slightly in the past: chain time lags wall-clock; future timestamps revert.
    const asOf = BigInt(Math.floor(Date.now() / 1000) - 60);
    const reportURIHash = reportURI.trim() ? toBytes32Label(reportURI.trim()) : ZERO_BYTES32;
    try {
      await run({
        address: oracle,
        abi: RESERVE_ORACLE_ABI,
        functionName: "attestReserves",
        args: [reserveAmount, asOf, reportURIHash, reportURI.trim(), note.trim()],
        description: "Attest reserves",
      });
      setAmount("");
      onChanged?.();
    } catch {
      /* surfaced */
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Record a proof-of-reserves total. Issuance can never exceed this. Must be a different wallet
        from the MINTER (separation of duties). RESERVE_ATTESTER role.
      </p>
      <Field label={`Reserve amount (${symbol ?? "tokens"})`} value={amount} onChange={setAmount} placeholder="1000000" />
      <Field label="Report URI" value={reportURI} onChange={setReportURI} placeholder="ipfs://… or https://… (attestation document)" />
      <Field label="Attestor note" value={note} onChange={setNote} placeholder="e.g. Monthly audit by …" />
      {local && <p className="text-sm text-destructive">{local}</p>}
      <Status isLoading={isLoading} error={error} hash={hash} label="Attest reserves" disabled={!oracle} onSubmit={submit} />
    </div>
  );
}

// ─── Issue (token) ────────────────────────────────────────────
function IssueForm({
  token,
  dec,
  symbol,
  onChanged,
}: {
  token: Address;
  dec: number;
  symbol?: string;
  onChanged?: () => void;
}) {
  const { run, isLoading, error, hash, reset } = useStablecoinAdminAction();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [ref, setRef] = useState("");
  const [local, setLocal] = useState<string | null>(null);

  const submit = async () => {
    setLocal(null);
    reset();
    if (!/^0x[a-fA-F0-9]{40}$/.test(to.trim())) {
      setLocal("Enter a valid recipient address.");
      return;
    }
    let value: bigint;
    try {
      value = toBaseUnits(amount, dec);
    } catch (e) {
      setLocal((e as Error).message);
      return;
    }
    try {
      await run({
        address: token,
        abi: STABLECOIN_TOKEN_ABI,
        functionName: "issue",
        args: [to.trim() as Address, value, toReference(ref)],
        description: "Issue stablecoin",
      });
      setAmount("");
      onChanged?.();
    } catch {
      /* surfaced */
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Mint to a compliant recipient against attested reserves. Reverts unless proof-of-reserves
        covers the new supply. MINTER role.
      </p>
      <Field label="Recipient" value={to} onChange={setTo} placeholder="0x…" mono />
      <Field label={`Amount (${symbol ?? "tokens"})`} value={amount} onChange={setAmount} placeholder="250000" />
      <Field label="Mint reference (optional)" value={ref} onChange={setRef} placeholder="wire ID / memo (hashed to bytes32)" />
      {local && <p className="text-sm text-destructive">{local}</p>}
      <Status isLoading={isLoading} error={error} hash={hash} label="Issue" onSubmit={submit} />
    </div>
  );
}

// ─── Redemption fulfil / cancel (token) ───────────────────────
function RedemptionForm({
  token,
  dec,
  symbol,
  onChanged,
}: {
  token: Address;
  dec: number;
  symbol?: string;
  onChanged?: () => void;
}) {
  const { run, isLoading, error, hash, reset } = useStablecoinAdminAction();
  const [holder, setHolder] = useState("");
  const [amount, setAmount] = useState("");
  const [ref, setRef] = useState("");
  const [local, setLocal] = useState<string | null>(null);

  const act = async (fn: "fulfillRedemption" | "cancelRedemption") => {
    setLocal(null);
    reset();
    if (!/^0x[a-fA-F0-9]{40}$/.test(holder.trim())) {
      setLocal("Enter a valid holder address.");
      return;
    }
    let value: bigint;
    try {
      value = toBaseUnits(amount, dec);
    } catch (e) {
      setLocal((e as Error).message);
      return;
    }
    try {
      await run({
        address: token,
        abi: STABLECOIN_TOKEN_ABI,
        functionName: fn,
        args: [holder.trim() as Address, value, toReference(ref)],
        description: fn === "fulfillRedemption" ? "Fulfil redemption" : "Cancel redemption",
      });
      onChanged?.();
    } catch {
      /* surfaced */
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Settle a held redemption after the off-chain wire (fulfil = release + burn) or release the
        hold without burning (cancel). REDEEMER role.
      </p>
      <Field label="Holder" value={holder} onChange={setHolder} placeholder="0x…" mono />
      <Field label={`Amount (${symbol ?? "tokens"})`} value={amount} onChange={setAmount} placeholder="50000" />
      <Field label="Redemption reference (optional)" value={ref} onChange={setRef} placeholder="request id / memo" />
      {local && <p className="text-sm text-destructive">{local}</p>}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {hash && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> Submitted — tx <code className="font-mono text-xs">{hash.slice(0, 10)}…</code>
        </p>
      )}
      <div className="flex gap-2">
        <Button onClick={() => act("fulfillRedemption")} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Fulfil (burn)
        </Button>
        <Button variant="outline" onClick={() => act("cancelRedemption")} disabled={isLoading}>
          Cancel (release)
        </Button>
      </div>
    </div>
  );
}

// ─── Compliance: freeze / unfreeze (token) ────────────────────
function ComplianceForm({ token, onChanged }: { token: Address; onChanged?: () => void }) {
  const { run, isLoading, error, hash, reset } = useStablecoinAdminAction();
  const [account, setAccount] = useState("");
  const [local, setLocal] = useState<string | null>(null);

  const act = async (fn: "freeze" | "unfreeze") => {
    setLocal(null);
    reset();
    if (!/^0x[a-fA-F0-9]{40}$/.test(account.trim())) {
      setLocal("Enter a valid wallet address.");
      return;
    }
    try {
      await run({
        address: token,
        abi: STABLECOIN_TOKEN_ABI,
        functionName: fn,
        args: [account.trim() as Address],
        description: fn === "freeze" ? "Freeze holder" : "Unfreeze holder",
      });
      onChanged?.();
    } catch {
      /* surfaced */
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Block or unblock a holder from sending/receiving (OFAC / court order). Force-burn still works
        against frozen holders.
      </p>
      <Field label="Wallet address" value={account} onChange={setAccount} placeholder="0x…" mono />
      {local && <p className="text-sm text-destructive">{local}</p>}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {hash && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> Submitted — tx <code className="font-mono text-xs">{hash.slice(0, 10)}…</code>
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="destructive" onClick={() => act("freeze")} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Freeze
        </Button>
        <Button variant="outline" onClick={() => act("unfreeze")} disabled={isLoading}>
          Unfreeze
        </Button>
      </div>
    </div>
  );
}
