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
import { useReadContract } from "wagmi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Settings2 } from "lucide-react";
import { useStablecoinAdminAction } from "@/lib/hooks/useStablecoinAdmin";
import { STABLECOIN_TOKEN_ABI } from "@/lib/generated/stablecoin-token";
import { RESERVE_ORACLE_ABI } from "@/lib/generated/reserve-oracle";
import { IDENTITY_REGISTRY_ABI, STABLECOIN_COMPLIANCE_ABI } from "@/lib/contracts/stablecoin-compliance-abi";
import { toBytes32Label, ZERO_BYTES32 } from "@/lib/contracts/stablecoin-payload";
import { TRANSFER_POLICY_OPTIONS } from "@/types/stablecoin";
import type { Address, Hex } from "@/lib/core/types";

interface Props {
  token: Address;
  oracle: Address | null;
  compliance: Address | null;
  identity: Address | null;
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

export function StablecoinManagePanel({ token, oracle, compliance, identity, decimals, symbol, onChanged }: Props) {
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="reserves">Reserves</TabsTrigger>
            <TabsTrigger value="issue">Issue</TabsTrigger>
            <TabsTrigger value="redeem">Redeem</TabsTrigger>
            <TabsTrigger value="identity">Identity</TabsTrigger>
            <TabsTrigger value="freeze">Freeze</TabsTrigger>
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
          <TabsContent value="identity" className="pt-4">
            <IdentityForm compliance={compliance} identity={identity} onChanged={onChanged} />
          </TabsContent>
          <TabsContent value="freeze" className="pt-4">
            <FreezeForm token={token} onChanged={onChanged} />
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

// ─── Identity & transfer policy (compliance checker + identity registry) ──
function IdentityForm({
  compliance,
  identity,
  onChanged,
}: {
  compliance: Address | null;
  identity: Address | null;
  onChanged?: () => void;
}) {
  const policyAction = useStablecoinAdminAction();
  const holderAction = useStablecoinAdminAction();
  const [policy, setPolicy] = useState<string>("");
  const [account, setAccount] = useState("");
  const [local, setLocal] = useState<string | null>(null);

  // Current on-chain transfer policy.
  const policyRead = useReadContract({
    address: compliance ?? undefined,
    abi: STABLECOIN_COMPLIANCE_ABI,
    functionName: "transferPolicy",
    query: { enabled: !!compliance },
  });
  const currentPolicy = policyRead.data as number | undefined;
  const selectedPolicy = policy || (currentPolicy !== undefined ? String(currentPolicy) : "1");

  // Holder status lookup (verified / jurisdiction / blocked).
  const verified = useReadContract({
    address: identity ?? undefined, abi: IDENTITY_REGISTRY_ABI, functionName: "isVerified",
    args: [account.trim() as Address], query: { enabled: !!identity && /^0x[a-fA-F0-9]{40}$/.test(account.trim()) },
  });
  const jurisdiction = useReadContract({
    address: identity ?? undefined, abi: IDENTITY_REGISTRY_ABI, functionName: "isJurisdictionApproved",
    args: [account.trim() as Address], query: { enabled: !!identity && /^0x[a-fA-F0-9]{40}$/.test(account.trim()) },
  });
  const blocked = useReadContract({
    address: identity ?? undefined, abi: IDENTITY_REGISTRY_ABI, functionName: "isBlocked",
    args: [account.trim() as Address], query: { enabled: !!identity && /^0x[a-fA-F0-9]{40}$/.test(account.trim()) },
  });

  const savePolicy = async () => {
    if (!compliance) return;
    try {
      await policyAction.run({
        address: compliance,
        abi: STABLECOIN_COMPLIANCE_ABI,
        functionName: "setTransferPolicy",
        args: [Number(selectedPolicy)],
        description: "Set transfer policy",
      });
      policyRead.refetch();
      onChanged?.();
    } catch {
      /* surfaced */
    }
  };

  const holderAct = async (
    fn: "setIdentity" | "setBlocked",
    args: readonly unknown[],
    description: string,
  ) => {
    setLocal(null);
    holderAction.reset();
    if (!identity) {
      setLocal("Identity registry address unavailable.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(account.trim())) {
      setLocal("Enter a valid wallet address.");
      return;
    }
    try {
      await holderAction.run({ address: identity, abi: IDENTITY_REGISTRY_ABI, functionName: fn, args, description });
      verified.refetch();
      jurisdiction.refetch();
      blocked.refetch();
      onChanged?.();
    } catch {
      /* surfaced */
    }
  };

  const addr = account.trim() as Address;
  const statusKnown = /^0x[a-fA-F0-9]{40}$/.test(account.trim()) && verified.data !== undefined;

  return (
    <div className="space-y-6">
      {/* Transfer policy */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Transfer policy</p>
          <p className="text-xs text-muted-foreground">
            Governs P2P transfers only — issuance & redemption stay KYC-gated. Restricted on the
            compliance checker.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">
              Policy {currentPolicy !== undefined && <span className="text-muted-foreground">(current: {currentPolicy === 1 ? "Blocklist" : "Allowlist"})</span>}
            </Label>
            <Select value={selectedPolicy} onValueChange={setPolicy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRANSFER_POLICY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={savePolicy} disabled={policyAction.isLoading || !compliance}>
            {policyAction.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
        {policyAction.error && <p className="text-sm text-destructive">{policyAction.error.message}</p>}
      </div>

      <div className="border-t" />

      {/* Holder allowlist / sanctions */}
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium">Holder identity</p>
          <p className="text-xs text-muted-foreground">
            Allowlist a KYC&apos;d holder (verify + jurisdiction) so they can receive tokens, or block
            a sanctioned address. Restricted on the identity registry.
          </p>
        </div>
        <Field label="Wallet address" value={account} onChange={setAccount} placeholder="0x…" mono />

        {statusKnown && (
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={verified.data ? "default" : "secondary"}>{verified.data ? "Verified" : "Not verified"}</Badge>
            <Badge variant={jurisdiction.data ? "default" : "secondary"}>{jurisdiction.data ? "Jurisdiction OK" : "Jurisdiction not approved"}</Badge>
            {blocked.data ? <Badge variant="destructive">Blocked</Badge> : <Badge variant="outline">Not blocked</Badge>}
          </div>
        )}

        {local && <p className="text-sm text-destructive">{local}</p>}
        {holderAction.error && <p className="text-sm text-destructive">{holderAction.error.message}</p>}
        {holderAction.hash && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Submitted — tx <code className="font-mono text-xs">{holderAction.hash.slice(0, 10)}…</code>
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => holderAct("setIdentity", [addr, true, true], "Verify holder")} disabled={holderAction.isLoading}>
            {holderAction.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify (KYC + jurisdiction)
          </Button>
          <Button variant="outline" onClick={() => holderAct("setIdentity", [addr, false, false], "Revoke verification")} disabled={holderAction.isLoading}>
            Revoke
          </Button>
          <Button variant="destructive" onClick={() => holderAct("setBlocked", [addr, true], "Block holder")} disabled={holderAction.isLoading}>
            Block
          </Button>
          <Button variant="outline" onClick={() => holderAct("setBlocked", [addr, false], "Unblock holder")} disabled={holderAction.isLoading}>
            Unblock
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Freeze / unfreeze (token-level) ──────────────────────────
function FreezeForm({ token, onChanged }: { token: Address; onChanged?: () => void }) {
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
        Token-level freeze — instantly halts a holder&apos;s sending/receiving (OFAC / court order).
        Force-burn still works against frozen holders. For registry-level sanctions/allowlist, use the
        Identity tab.
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
