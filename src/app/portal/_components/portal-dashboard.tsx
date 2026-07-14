"use client";

// ============================================================
// The corporate-treasury client view of tokenized deposits.
//
// This is the HOLDER perspective (vs the operator/issuer workspaces): two
// accounts and one on/off-ramp, mirroring JPMorgan's Kinexys model —
//   • DDA  Demand Deposit Account   (traditional cash)
//   • BDA  Blockchain Deposit Account (on-chain, 24/7)   ← the connected wallet
// The client funds the BDA from the DDA, pays other holders instantly at any
// hour, and redeems back. Mint / reconciliation / allowlist enforcement are
// bank-side plumbing and stay invisible here.
//
// The wallet ADDRESS is real (useWallet). Balances are simulated — the deposit
// cluster / settlement adapter is not wired yet (see src/lib/products/registry).
// ============================================================

import { useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Landmark,
  Wallet,
  Zap,
  Send,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { useWallet } from "@/lib/hooks/useWallet";
import type { Address } from "@/lib/core/types";

const cad = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const round2 = (n: number) => Math.round(n * 100) / 100;

type ActKind = "fund" | "pay" | "redeem" | "blocked";
interface Activity {
  id: number;
  kind: ActKind;
  title: string;
  detail: string;
  amount: number;
  when: string;
}

const PAYEES = [
  { id: "beta", name: "Beta Corp Treasury", addr: "0x7a3f…c21b", allowlisted: true },
  { id: "gamma", name: "Gamma Pension Fund", addr: "0x9d1e…4f88", allowlisted: true },
  { id: "meridian", name: "Meridian Holdings (SG)", addr: "0x4c02…a7d5", allowlisted: true },
  { id: "unlisted", name: "Unlisted wallet", addr: "0x000…dead", allowlisted: false },
];

const SEED_ACTIVITY: Activity[] = [
  { id: 3, kind: "pay", title: "Payment sent", detail: "To Beta Corp Treasury", amount: 1250000, when: "Yesterday, 21:14" },
  { id: 2, kind: "fund", title: "Funded BDA", detail: "From DDA", amount: 3000000, when: "2 days ago, 09:02" },
  { id: 1, kind: "redeem", title: "Redeemed to DDA", detail: "Swept to demand account", amount: 500000, when: "5 days ago, 16:40" },
];

interface Props {
  clientName: string;
  linkedAddress: Address | null;
}

export function PortalDashboard({ clientName, linkedAddress }: Props) {
  const { address, shortAddress, isConnected } = useWallet();

  // Real wallet address when available; a demo address otherwise so the view
  // still reads as a real account in a client presentation.
  const bdaAddress = shortAddress ?? "0x9F2a…4b2C";
  const isLinked =
    !!address && !!linkedAddress && address.toLowerCase() === linkedAddress.toLowerCase();

  const [dda, setDda] = useState(8_000_000);
  const [bda, setBda] = useState(2_000_000);
  const [activity, setActivity] = useState<Activity[]>(SEED_ACTIVITY);
  const nextId = useMemo(() => ({ v: 100 }), []);

  const log = (kind: ActKind, title: string, detail: string, amount: number) => {
    const now = new Date();
    const when = `Just now, ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setActivity((prev) => [{ id: nextId.v++, kind, title, detail, amount, when }, ...prev]);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{clientName}</h1>
          <p className="text-sm text-muted-foreground">
            Move bank money on-chain — pay any holder, any hour, settled in seconds.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <Zap className="h-3.5 w-3.5 text-emerald-500" />
          24/7 · instant settlement
        </Badge>
      </div>

      {/* Accounts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <AccountCard
          icon={Landmark}
          kicker="Demand Deposit Account · DDA"
          sub="Traditional cash · banking hours"
          amount={dda}
        />
        <AccountCard
          icon={Wallet}
          kicker="Blockchain Deposit Account · BDA"
          sub="On-chain · available to send"
          amount={bda}
          accent
          footer={
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3 text-xs">
              <span className="font-mono text-muted-foreground">{bdaAddress}</span>
              {isLinked ? (
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" /> Linked wallet
                </Badge>
              ) : (
                <span className="text-[10px] text-muted-foreground">
                  {isConnected ? "your wallet" : "demo wallet"}
                </span>
              )}
            </div>
          }
        />
      </div>

      {/* Move money */}
      <Card id="move-money">
        <CardHeader>
          <CardTitle className="text-base">Move money</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pay">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pay">Pay</TabsTrigger>
              <TabsTrigger value="fund">Fund BDA</TabsTrigger>
              <TabsTrigger value="redeem">Redeem</TabsTrigger>
            </TabsList>

            <TabsContent value="pay" className="pt-4">
              <PayForm
                bda={bda}
                onPay={(amt, payee) => {
                  setBda((b) => round2(b - amt));
                  log("pay", "Payment sent", `To ${payee}`, amt);
                }}
                onBlocked={(amt, payee) => {
                  log("blocked", "Payment blocked", `To ${payee} · not allowlisted`, amt);
                }}
              />
            </TabsContent>

            <TabsContent value="fund" className="pt-4">
              <MoveForm
                label="Amount to move from DDA"
                cta="Fund BDA"
                icon={ArrowDownToLine}
                max={dda}
                hint="Moves cash from your demand account onto the on-chain rail. Available to spend immediately."
                onSubmit={(amt) => {
                  setDda((d) => round2(d - amt));
                  setBda((b) => round2(b + amt));
                  log("fund", "Funded BDA", "From DDA", amt);
                }}
              />
            </TabsContent>

            <TabsContent value="redeem" className="pt-4">
              <MoveForm
                label="Amount to redeem to DDA"
                cta="Redeem"
                icon={ArrowUpFromLine}
                max={bda}
                hint="Moves value back off the rail into your demand account."
                onSubmit={(amt) => {
                  setBda((b) => round2(b - amt));
                  setDda((d) => round2(d + amt));
                  log("redeem", "Redeemed to DDA", "Swept to demand account", amt);
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul>
            {activity.map((a) => (
              <ActivityRow key={a.id} a={a} />
            ))}
          </ul>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Balances are illustrative — the deposit cluster and settlement adapter are not wired yet. The
        wallet address is your real on-chain account. Payments are permissioned (allowlisted holders
        only) and settle 1:1 against the bank&apos;s core ledger behind the scenes.
      </p>
    </div>
  );
}

// ─── Account card ─────────────────────────────────────────────
function AccountCard({
  icon: Icon,
  kicker,
  sub,
  amount,
  accent,
  footer,
}: {
  icon: React.ElementType;
  kicker: string;
  sub: string;
  amount: number;
  accent?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <Card className={accent ? "border-primary/40" : undefined}>
      <CardContent className="py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">{kicker}</p>
          </div>
        </div>
        <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">{cad.format(amount)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        {footer}
      </CardContent>
    </Card>
  );
}

// ─── Pay form ─────────────────────────────────────────────────
function PayForm({
  bda,
  onPay,
  onBlocked,
}: {
  bda: number;
  onPay: (amt: number, payee: string) => void;
  onBlocked: (amt: number, payee: string) => void;
}) {
  const [payeeId, setPayeeId] = useState(PAYEES[0].id);
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const selected = PAYEES.find((p) => p.id === payeeId)!;

  const submit = () => {
    const amt = round2(Number(amount.replace(/[, ]/g, "")));
    const payee = PAYEES.find((p) => p.id === payeeId)!;
    if (!amt || amt <= 0) return setMsg({ ok: false, text: "Enter an amount greater than zero." });
    if (!payee.allowlisted) {
      onBlocked(amt, payee.name);
      setAmount("");
      return setMsg({
        ok: false,
        text: `Payment blocked — ${payee.name} isn't an allowlisted holder. Bank money can only move to KYB-verified, sanctions-screened accounts.`,
      });
    }
    if (amt > bda) return setMsg({ ok: false, text: `Amount exceeds your BDA balance (${cad.format(bda)}).` });
    onPay(amt, payee.name);
    setAmount("");
    setMsg({ ok: true, text: `Sent ${cad.format(amt)} to ${payee.name} — settled instantly.` });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Pay to</Label>
          <Select value={payeeId} onValueChange={setPayeeId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYEES.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="font-mono text-[11px]">
            <span className="text-muted-foreground">{selected.addr} · </span>
            {selected.allowlisted ? (
              <span className="text-emerald-600 dark:text-emerald-400">allowlisted ✓</span>
            ) : (
              <span className="text-destructive">not allowlisted ✕</span>
            )}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Amount (CAD)</Label>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            className="font-mono tabular-nums"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={submit}>
          <Send className="mr-2 h-4 w-4" />
          Send payment
        </Button>
        <span className="text-xs text-muted-foreground">Any hour · settles in seconds</span>
      </div>
      {msg && <Result ok={msg.ok} text={msg.text} />}
    </div>
  );
}

// ─── Fund / Redeem form ───────────────────────────────────────
function MoveForm({
  label,
  cta,
  icon: Icon,
  max,
  hint,
  onSubmit,
}: {
  label: string;
  cta: string;
  icon: React.ElementType;
  max: number;
  hint: string;
  onSubmit: (amt: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = () => {
    const amt = round2(Number(amount.replace(/[, ]/g, "")));
    if (!amt || amt <= 0) return setMsg({ ok: false, text: "Enter an amount greater than zero." });
    if (amt > max) return setMsg({ ok: false, text: `Amount exceeds the available balance (${cad.format(max)}).` });
    onSubmit(amt);
    setAmount("");
    setMsg({ ok: true, text: `${cad.format(amt)} moved — done.` });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">{label}</Label>
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          className="max-w-xs font-mono tabular-nums"
        />
      </div>
      <p className="max-w-lg text-xs text-muted-foreground">{hint}</p>
      <Button onClick={submit}>
        <Icon className="mr-2 h-4 w-4" />
        {cta}
      </Button>
      {msg && <Result ok={msg.ok} text={msg.text} />}
    </div>
  );
}

function Result({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p className={`flex items-center gap-1.5 text-sm ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
      {ok && <CheckCircle2 className="h-4 w-4" />}
      {text}
    </p>
  );
}

// ─── Activity row ─────────────────────────────────────────────
const ACT_META: Record<ActKind, { sign: string; cls: string }> = {
  fund: { sign: "+", cls: "text-emerald-600 dark:text-emerald-400" },
  pay: { sign: "−", cls: "text-foreground" },
  redeem: { sign: "−", cls: "text-muted-foreground" },
  blocked: { sign: "", cls: "text-muted-foreground line-through" },
};

function ActivityRow({ a }: { a: Activity }) {
  const meta = ACT_META[a.kind];
  const blocked = a.kind === "blocked";
  return (
    <li className="flex items-center justify-between gap-3 border-b px-5 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{a.title}</p>
        <p className="truncate text-xs text-muted-foreground">{a.detail} · {a.when}</p>
      </div>
      <div className="text-right">
        <p className={`font-mono text-sm tabular-nums ${meta.cls}`}>
          {meta.sign}{cad.format(a.amount)}
        </p>
        {blocked ? (
          <p className="flex items-center justify-end gap-1 text-[11px] text-destructive">
            <XCircle className="h-3 w-3" /> Rejected
          </p>
        ) : (
          <p className="flex items-center justify-end gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Settled
          </p>
        )}
      </div>
    </li>
  );
}
