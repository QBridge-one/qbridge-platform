"use client";

// ============================================================
// app/dashboard/tokens/page.tsx
// Token lifecycle operations — mint, burn, freeze, force ops
// Each action calls the corresponding BaseAssetToken function
// wagmi calls are stubbed — replace with useWriteContract
// ============================================================

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MOCK_ASSETS, MOCK_TOKEN_OPS } from "@/lib/mock-data";
import { ASSET_TYPE_LABELS } from "@/types/assets";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Coins, Flame, Lock, Unlock, Zap, ShieldAlert,
  Pause, Play, ArrowRightLeft, Hash, CheckCircle2,
  Loader2, Info, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Asset } from "@/types/db";

// ─── Schemas ──────────────────────────────────────────────────
const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

const mintSchema = z.object({
  assetId: z.string().min(1),
  toAddress: addressSchema,
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be positive"),
  reason: z.string().min(3, "Reason required"),
});

const burnSchema = z.object({
  assetId: z.string().min(1),
  fromAddress: addressSchema,
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be positive"),
  reason: z.string().min(3, "Reason required"),
});

const freezeSchema = z.object({
  assetId: z.string().min(1),
  accountAddress: addressSchema,
  freezeType: z.enum(["FULL", "PARTIAL"]),
  amount: z.string().optional(),
});

const forceTransferSchema = z.object({
  assetId: z.string().min(1),
  fromAddress: addressSchema,
  toAddress: addressSchema,
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be positive"),
  reason: z.string().min(10, "Detailed reason required for force operations"),
});

// ─── Deployed assets only ─────────────────────────────────────
const DEPLOYED = MOCK_ASSETS.filter((a) => !!a.contractAddress);

// ─── Shared asset selector ────────────────────────────────────
function AssetSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select deployed asset" />
      </SelectTrigger>
      <SelectContent>
        {DEPLOYED.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs">{a.symbol}</span>
              <span className="text-xs text-muted-foreground">— {a.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Operation result toast ───────────────────────────────────
function OpResult({ txHash, onClear }: { txHash: string; onClear: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 px-4 py-3">
      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Transaction submitted</p>
        <a
          href={`https://sepolia.etherscan.io/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-emerald-600 dark:text-emerald-400 font-mono hover:underline truncate block"
        >
          {txHash.slice(0, 24)}…{txHash.slice(-8)} ↗
        </a>
      </div>
      <button onClick={onClear} className="text-emerald-600 dark:text-emerald-400 text-xs hover:underline shrink-0">
        Clear
      </button>
    </div>
  );
}

// ─── Sensitive op warning ─────────────────────────────────────
function SensitiveWarning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function TokensPage() {
  const [mintTx, setMintTx] = useState<string | null>(null);
  const [burnTx, setBurnTx] = useState<string | null>(null);
  const [freezeTx, setFreezeTx] = useState<string | null>(null);
  const [forceTx, setForceTx] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null); // which op

  // ── Mint form ──
  const mintForm = useForm<z.infer<typeof mintSchema>>({
    resolver: zodResolver(mintSchema),
    defaultValues: { assetId: DEPLOYED[0]?.id ?? "", toAddress: "", amount: "", reason: "" },
  });

  // ── Burn form ──
  const burnForm = useForm<z.infer<typeof burnSchema>>({
    resolver: zodResolver(burnSchema),
    defaultValues: { assetId: DEPLOYED[0]?.id ?? "", fromAddress: "", amount: "", reason: "" },
  });

  // ── Freeze form ──
  const freezeForm = useForm<z.infer<typeof freezeSchema>>({
    resolver: zodResolver(freezeSchema),
    defaultValues: { assetId: DEPLOYED[0]?.id ?? "", accountAddress: "", freezeType: "FULL", amount: "" },
  });

  // ── Force transfer form ──
  const forceForm = useForm<z.infer<typeof forceTransferSchema>>({
    resolver: zodResolver(forceTransferSchema),
    defaultValues: { assetId: DEPLOYED[0]?.id ?? "", fromAddress: "", toAddress: "", amount: "", reason: "" },
  });

  const simulate = async (op: string) => {
    setLoading(op);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(null);
    return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  };

  const onMint = async (data: z.infer<typeof mintSchema>) => {
    // TODO: useWriteContract → call token.mint(data.toAddress, parseUnits(data.amount, decimals))
    const tx = await simulate("mint");
    setMintTx(tx);
    mintForm.reset({ ...mintForm.getValues(), amount: "", reason: "" });
  };

  const onBurn = async (data: z.infer<typeof burnSchema>) => {
    // TODO: useWriteContract → call token.burn(data.fromAddress, parseUnits(data.amount, decimals), data.reason)
    const tx = await simulate("burn");
    setBurnTx(tx);
    burnForm.reset({ ...burnForm.getValues(), amount: "", reason: "" });
  };

  const onFreeze = async (data: z.infer<typeof freezeSchema>) => {
    // TODO: if FULL → token.freeze(account) | if PARTIAL → token.setFrozenBalance(account, amount)
    const tx = await simulate("freeze");
    setFreezeTx(tx);
    freezeForm.reset({ ...freezeForm.getValues(), accountAddress: "", amount: "" });
  };

  const onForce = async (data: z.infer<typeof forceTransferSchema>) => {
    // TODO: useWriteContract → token.forceTransfer(from, to, amount) — ENFORCER_ROLE required
    const tx = await simulate("force");
    setForceTx(tx);
    forceForm.reset({ ...forceForm.getValues(), fromAddress: "", toAddress: "", amount: "", reason: "" });
  };

  const freezeType = freezeForm.watch("freezeType");

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Token Lifecycle</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Mint, burn, freeze, and force operations on your deployed tokens.
          All operations are role-gated by your TokenAccessManager.
        </p>
      </div>

      {/* ── Role requirement info ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Mint / Burn",        role: "MINTER",    icon: Coins,  color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Freeze / Unfreeze",  role: "COMPLIANCE", icon: Lock,   color: "text-blue-600 dark:text-blue-400" },
          { label: "Force Transfer",     role: "ENFORCER",  icon: Zap,    color: "text-amber-600 dark:text-amber-400" },
          { label: "Pause / Unpause",    role: "PAUSER",    icon: Pause,  color: "text-muted-foreground" },
        ].map(({ label, role, icon: Icon, color }) => (
          <div key={role} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
            <Icon className={cn("h-4 w-4 shrink-0", color)} />
            <div>
              <p className="text-xs font-medium">{label}</p>
              <Badge variant="outline" className="text-[10px] mt-0.5">{role}_ROLE</Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Operations (2/3) ── */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="mint">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="mint" className="text-xs">Mint</TabsTrigger>
              <TabsTrigger value="burn" className="text-xs">Burn</TabsTrigger>
              <TabsTrigger value="freeze" className="text-xs">Freeze</TabsTrigger>
              <TabsTrigger value="force" className="text-xs">Force</TabsTrigger>
            </TabsList>

            {/* ── MINT ── */}
            <TabsContent value="mint" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Mint Tokens
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Requires <code className="bg-muted px-1 rounded">MINTER_ROLE</code> on the token AccessManager.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mintTx && <OpResult txHash={mintTx} onClear={() => setMintTx(null)} />}
                  <Form {...mintForm}>
                    <form onSubmit={mintForm.handleSubmit(onMint)} className="space-y-4">
                      <FormField control={mintForm.control} name="assetId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token</FormLabel>
                          <FormControl><AssetSelect value={field.value} onChange={field.onChange} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={mintForm.control} name="toAddress" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipient Address</FormLabel>
                          <FormControl><Input placeholder="0x…" className="font-mono text-xs" {...field} /></FormControl>
                          <FormDescription className="text-xs">Typically the treasury address.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={mintForm.control} name="amount" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl><Input type="number" placeholder="e.g. 100000" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={mintForm.control} name="reason" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason</FormLabel>
                          <FormControl><Input placeholder="e.g. Q1 distribution tranche" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={loading === "mint"}>
                        {loading === "mint" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Coins className="mr-2 h-4 w-4" />}
                        {loading === "mint" ? "Minting…" : "Mint Tokens"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── BURN ── */}
            <TabsContent value="burn" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Flame className="h-4 w-4 text-red-500" />
                    Burn Tokens
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Requires <code className="bg-muted px-1 rounded">MINTER_ROLE</code>. Permanently destroys tokens.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {burnTx && <OpResult txHash={burnTx} onClear={() => setBurnTx(null)} />}
                  <SensitiveWarning>
                    Burning is irreversible. Tokens will be permanently removed from circulation.
                  </SensitiveWarning>
                  <Form {...burnForm}>
                    <form onSubmit={burnForm.handleSubmit(onBurn)} className="space-y-4">
                      <FormField control={burnForm.control} name="assetId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token</FormLabel>
                          <FormControl><AssetSelect value={field.value} onChange={field.onChange} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={burnForm.control} name="fromAddress" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Burn From Address</FormLabel>
                          <FormControl><Input placeholder="0x…" className="font-mono text-xs" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={burnForm.control} name="amount" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount to Burn</FormLabel>
                          <FormControl><Input type="number" placeholder="e.g. 50000" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={burnForm.control} name="reason" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason</FormLabel>
                          <FormControl><Input placeholder="e.g. Redemption batch #12" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" variant="destructive" className="w-full" disabled={loading === "burn"}>
                        {loading === "burn" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flame className="mr-2 h-4 w-4" />}
                        {loading === "burn" ? "Burning…" : "Burn Tokens"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── FREEZE ── */}
            <TabsContent value="freeze" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-500" />
                    Freeze / Unfreeze Account
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Requires <code className="bg-muted px-1 rounded">COMPLIANCE_ROLE</code>. Controls <code className="bg-muted px-1 rounded">_frozenBalance</code>.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {freezeTx && <OpResult txHash={freezeTx} onClear={() => setFreezeTx(null)} />}
                  <Form {...freezeForm}>
                    <form onSubmit={freezeForm.handleSubmit(onFreeze)} className="space-y-4">
                      <FormField control={freezeForm.control} name="assetId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token</FormLabel>
                          <FormControl><AssetSelect value={field.value} onChange={field.onChange} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={freezeForm.control} name="accountAddress" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account to Freeze</FormLabel>
                          <FormControl><Input placeholder="0x…" className="font-mono text-xs" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={freezeForm.control} name="freezeType" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Freeze Type</FormLabel>
                          <div className="grid grid-cols-2 gap-2">
                            {(["FULL", "PARTIAL"] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => field.onChange(t)}
                                className={cn(
                                  "rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all",
                                  field.value === t ? "border-primary bg-primary/5" : "border-border"
                                )}
                              >
                                {t === "FULL" ? "Full Freeze" : "Partial Freeze"}
                                <p className="text-[10px] font-normal text-muted-foreground mt-0.5">
                                  {t === "FULL" ? "freeze(account)" : "setFrozenBalance(account, amount)"}
                                </p>
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                      {freezeType === "PARTIAL" && (
                        <FormField control={freezeForm.control} name="amount" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frozen Amount</FormLabel>
                            <FormControl><Input type="number" placeholder="Tokens to freeze" {...field} /></FormControl>
                            <FormDescription className="text-xs">Sets _frozenBalance to this amount.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <Button type="submit" variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30" disabled={loading === "freeze"}>
                          {loading === "freeze" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                          Freeze
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          onClick={async () => {
                            // TODO: token.unfreeze(account)
                            const tx = await simulate("freeze");
                            setFreezeTx(tx);
                          }}
                          disabled={loading === "freeze"}
                        >
                          <Unlock className="mr-2 h-4 w-4" />
                          Unfreeze
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── FORCE ── */}
            <TabsContent value="force" className="mt-4">
              <Card className="border-amber-200 dark:border-amber-900/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    Force Operations
                    <Badge variant="destructive" className="text-[10px]">Sensitive</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Requires <code className="bg-muted px-1 rounded">ENFORCER_ROLE</code>.
                    Bypasses compliance checks and freeze state. For regulatory recovery only.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {forceTx && <OpResult txHash={forceTx} onClear={() => setForceTx(null)} />}
                  <SensitiveWarning>
                    Force operations bypass IComplianceChecker and frozen balance checks.
                    They work even when the contract is paused. Intended for court orders and regulatory recovery only. Every use is permanently recorded on-chain.
                  </SensitiveWarning>
                  <Form {...forceForm}>
                    <form onSubmit={forceForm.handleSubmit(onForce)} className="space-y-4">
                      <FormField control={forceForm.control} name="assetId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token</FormLabel>
                          <FormControl><AssetSelect value={field.value} onChange={field.onChange} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={forceForm.control} name="fromAddress" render={({ field }) => (
                          <FormItem>
                            <FormLabel>From</FormLabel>
                            <FormControl><Input placeholder="0x…" className="font-mono text-xs" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={forceForm.control} name="toAddress" render={({ field }) => (
                          <FormItem>
                            <FormLabel>To</FormLabel>
                            <FormControl><Input placeholder="0x…" className="font-mono text-xs" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={forceForm.control} name="amount" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl><Input type="number" placeholder="Tokens to force transfer" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={forceForm.control} name="reason" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Legal Reason (detailed)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g. Court order #2025-CV-1234 — regulatory recovery ordered by OSC on 2025-02-10"
                              className="resize-none text-xs"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button type="button" className="w-full bg-amber-600 hover:bg-amber-700 text-white" disabled={loading === "force"}>
                            {loading === "force" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                            Execute Force Transfer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Force Transfer</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will call <code className="bg-muted px-1 rounded">forceTransfer()</code> on the token contract, bypassing all compliance checks and freeze states. This action is permanently recorded on-chain and cannot be undone. Confirm only if you have legal authority to do so.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-amber-600 hover:bg-amber-700"
                              onClick={forceForm.handleSubmit(onForce)}
                            >
                              Confirm Force Transfer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Recent Operations (1/3) ── */}
        <div>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recent Operations</CardTitle>
              <CardDescription className="text-xs">Last 10 on-chain events</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {MOCK_TOKEN_OPS.map((op) => {
                  const asset = MOCK_ASSETS.find((a) => a.id === op.assetId);
                  const colors: Record<string, string> = {
                    MINT: "text-emerald-600 dark:text-emerald-400",
                    BURN: "text-red-600 dark:text-red-400",
                    FORCE_TRANSFER: "text-amber-600 dark:text-amber-400",
                    FREEZE: "text-blue-600 dark:text-blue-400",
                    UNFREEZE: "text-emerald-600 dark:text-emerald-400",
                  };
                  return (
                    <div key={op.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("text-xs font-semibold", colors[op.type] ?? "text-muted-foreground")}>
                              {op.type.replace("_", " ")}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {asset?.symbol}
                            </span>
                          </div>
                          {op.amount && (
                            <p className="text-xs text-foreground mt-0.5">
                              {Number(op.amount).toLocaleString()} tokens
                            </p>
                          )}
                          {op.reason && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{op.reason}</p>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(op.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
