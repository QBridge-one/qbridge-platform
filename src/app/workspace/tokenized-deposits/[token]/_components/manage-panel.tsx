"use client";

// ============================================================
// app/workspace/tokenized-deposits/[token]/_components/manage-panel.tsx
//
// The deposit-token control surface — a scaffolded analog of the stablecoin
// manage panel, reduced to the two tabs that define a tokenized deposit:
//   • Identity / allowlist — the permissioned-transfer control (allowlist of
//     KYB-verified holders). Mirrors the stablecoin IdentityForm.
//   • Settlement — the two-phase-commit binding to the core banking ledger.
//
// Read-only: there is no deposit compliance/identity contract or settlement
// adapter wired yet, so controls render but stay disabled (same "degrade to
// disabled" posture the stablecoin panel uses when an address is missing).
// Issue / Redeem / Reserves are intentionally absent — a deposit is a bank
// liability settled 1:1 to core banking, not a reserve-backed instrument.
// ============================================================

import { useState } from "react";
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
import { Settings2, Lock, ArrowLeftRight, Info } from "lucide-react";
import { TRANSFER_POLICY_OPTIONS } from "@/types/stablecoin";
import { shortAddress } from "@/lib/contracts/deal-labels";
import type { Address } from "@/lib/core/types";

interface Props {
  token: Address;
}

export function TokenizedDepositManagePanel({ token }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="h-4 w-4 text-primary" />
          Manage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="identity">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="identity">Identity / allowlist</TabsTrigger>
            <TabsTrigger value="settlement">Settlement</TabsTrigger>
          </TabsList>

          <TabsContent value="identity" className="pt-4">
            <IdentityTab />
          </TabsContent>
          <TabsContent value="settlement" className="pt-4">
            <SettlementTab token={token} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ─── Scaffold banner ──────────────────────────────────────────
function ScaffoldNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

// ─── Identity / allowlist (permissioned transfer) ─────────────
function IdentityTab() {
  const [policy, setPolicy] = useState<string>("0"); // Allowlist — the deposit default
  const [account, setAccount] = useState("");

  return (
    <div className="space-y-6">
      <ScaffoldNote>
        Read-only preview — the compliance checker and identity registry are wired when the deposit
        cluster is deployed. This is the control surface a bank operator uses to permission holders.
      </ScaffoldNote>

      {/* Transfer policy */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Transfer policy</p>
          <p className="text-xs text-muted-foreground">
            A deposit token stays <strong className="text-foreground">Allowlist (permissioned)</strong> — only KYB-verified,
            jurisdiction-cleared holders can receive. Governs P2P transfers; issuance & redemption are KYB-gated regardless.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">Policy</Label>
            <Select value={policy} onValueChange={setPolicy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRANSFER_POLICY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button disabled>Save</Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {TRANSFER_POLICY_OPTIONS.find((o) => o.value === policy)?.hint}
        </p>
      </div>

      <div className="border-t" />

      {/* Holder allowlist */}
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium">Holder identity</p>
          <p className="text-xs text-muted-foreground">
            Allowlist a KYB&apos;d holder (verify + jurisdiction) so they can receive the deposit token, or
            block a sanctioned address (Canadian SEMA / OSFI; OFAC on a USD nexus). On-chain via the identity registry.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Wallet address</Label>
          <Input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="0x…"
            className="font-mono text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled>
            <Lock className="mr-2 h-4 w-4" />
            Verify (KYB + jurisdiction)
          </Button>
          <Button variant="outline" disabled>Revoke</Button>
          <Button variant="destructive" disabled>Block</Button>
          <Button variant="outline" disabled>Unblock</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Settlement (core-ledger binding) ─────────────────────────
function SettlementTab({ token }: { token: Address }) {
  return (
    <div className="space-y-5">
      <ScaffoldNote>
        The settlement adapter binds this token to the bank&apos;s core ledger. It is the one open
        integration that turns the scaffold into live issuance and redemption.
      </ScaffoldNote>

      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
          <ArrowLeftRight className="h-4 w-4 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Two-phase-commit core-ledger settlement</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Mint and redeem bind atomically to a debit/credit on the core deposit ledger — finalized on-chain
            only after core confirms, reconciled 1:1 so token supply can never diverge from the deposit balance.
            (True DvP applies only when this token settles the cash leg of a tokenized security or repo.)
          </p>
        </div>
      </div>

      <div className="rounded-lg border">
        <Row label="Deposit token" value={shortAddress(token)} />
        <Row label="Core ledger (system of record)" value="— (pending)" />
        <Row label="Settlement adapter" value="— (pending)" />
        <Row label="Reconciliation" value="1:1 supply ↔ core control balance" />
        <Row label="Finality" value="On-chain after core confirms" last />
      </div>

      <Button disabled>
        <ArrowLeftRight className="mr-2 h-4 w-4" />
        Run reconciliation (pending settlement adapter)
      </Button>
    </div>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-3 py-2.5 text-sm ${last ? "" : "border-b"}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-xs">{value}</span>
    </div>
  );
}
