"use client";

// ============================================================
// app/dashboard/settings/team/page.tsx
// Team & Role Management — Platform roles + per-token roles
// Aligned with DualAccessManagedUpgradeable two-tier RBAC
// ============================================================

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MOCK_TEAM, MOCK_ASSETS } from "@/lib/mock-data";
import {
  ALL_PLATFORM_ROLES, ALL_TOKEN_ROLES,
  PLATFORM_ROLE_LABELS, PLATFORM_ROLE_DESCRIPTIONS,
  TOKEN_ROLE_LABELS, TOKEN_ROLE_DESCRIPTIONS,
  type PlatformRole, type TokenRole,
} from "@/types/roles";
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
import {
  Users, Shield, Plus, Trash2, AlertTriangle,
  CheckCircle2, Info, Copy, ExternalLink,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/types/db";

// ─── Schemas ──────────────────────────────────────────────────
const grantPlatformRoleSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  role: z.enum(["ADMIN", "COMPLIANCE", "OPERATOR", "AUDITOR"]),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  name: z.string().optional(),
});

const grantTokenRoleSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  assetId: z.string().min(1, "Select an asset"),
  role: z.enum(["ADMIN", "MINTER", "COMPLIANCE", "ENFORCER", "PAUSER", "AUDITOR"]),
});

const PLATFORM_ROLE_COLORS: Record<string, string> = {
  ADMIN:      "text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50",
  COMPLIANCE: "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
  OPERATOR:   "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
  AUDITOR:    "text-muted-foreground",
};

const TOKEN_ROLE_COLORS: Record<string, string> = {
  ADMIN:      "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  MINTER:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  COMPLIANCE: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  ENFORCER:   "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  PAUSER:     "bg-muted text-muted-foreground",
  AUDITOR:    "bg-muted text-muted-foreground",
};

function shortAddr(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

// ─── Page ─────────────────────────────────────────────────────
export default function TeamPage() {
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [grantSuccess, setGrantSuccess] = useState<string | null>(null);

  const deployedAssets = MOCK_ASSETS.filter((a) => !!a.contractAddress);

  const platformForm = useForm<z.infer<typeof grantPlatformRoleSchema>>({
    resolver: zodResolver(grantPlatformRoleSchema),
    defaultValues: { walletAddress: "", role: undefined, email: "", name: "" },
  });

  const tokenForm = useForm<z.infer<typeof grantTokenRoleSchema>>({
    resolver: zodResolver(grantTokenRoleSchema),
    defaultValues: { walletAddress: "", assetId: "", role: undefined },
  });

  const selectedPlatformRole = platformForm.watch("role");
  const selectedTokenRole = tokenForm.watch("role");
  const isSensitivePlatform = selectedPlatformRole === "ADMIN" || selectedPlatformRole === "COMPLIANCE";
  const isSensitiveToken = selectedTokenRole === "ADMIN" || selectedTokenRole === "ENFORCER";

  const onGrantPlatform = async (data: z.infer<typeof grantPlatformRoleSchema>) => {
    // TODO: call PlatformAccessManager.grantRole(PLATFORM_ROLES[data.role], data.walletAddress)
    await new Promise((r) => setTimeout(r, 1000));
    setGrantSuccess(`Platform ${data.role} role granted to ${shortAddr(data.walletAddress)}`);
    platformForm.reset();
    setTimeout(() => setGrantSuccess(null), 5000);
  };

  const onGrantToken = async (data: z.infer<typeof grantTokenRoleSchema>) => {
    // TODO: call TokenAccessManager.grantRole(TOKEN_ROLES[data.role], data.walletAddress) for the asset's TAM
    await new Promise((r) => setTimeout(r, 1000));
    const asset = deployedAssets.find((a) => a.id === data.assetId);
    setGrantSuccess(`Token ${data.role} role granted on ${asset?.symbol} to ${shortAddr(data.walletAddress)}`);
    tokenForm.reset();
    setTimeout(() => setGrantSuccess(null), 5000);
  };

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team & Role Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage access via two-tier RBAC — Platform AccessManager and per-token AccessManagers.
          All role grants are on-chain transactions.
        </p>
      </div>

      {/* ── Architecture card ── */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
            <div className="space-y-1">
              <p>
                <strong className="text-foreground">Platform AccessManager</strong> — controls platform-level ops (issuer approval, compliance infra, emergency controls). Managed by QBridge.
              </p>
              <p>
                <strong className="text-foreground">Token AccessManager</strong> — one per deployed token, controlled by the issuer (ADMIN_ROLE id 0). Controls mint, burn, freeze, and force ops.
              </p>
              <p>
                Each role grant calls <code className="bg-muted px-1 rounded">grantRole(roleId, targetAddress)</code> on the relevant <code className="bg-muted px-1 rounded">AccessManagerUpgradeable</code> contract.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {grantSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{grantSuccess}</p>
        </div>
      )}

      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team">Team Members</TabsTrigger>
          <TabsTrigger value="grant-platform">Grant Platform Role</TabsTrigger>
          <TabsTrigger value="grant-token">Grant Token Role</TabsTrigger>
          <TabsTrigger value="roles">Role Reference</TabsTrigger>
        </TabsList>

        {/* ── TEAM MEMBERS ── */}
        <TabsContent value="team" className="mt-4 space-y-3">
          {MOCK_TEAM.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              expanded={expandedMember === member.id}
              onToggle={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
            />
          ))}
        </TabsContent>

        {/* ── GRANT PLATFORM ROLE ── */}
        <TabsContent value="grant-platform" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Grant Platform Role
              </CardTitle>
              <CardDescription className="text-xs">
                Assigns a role on the <strong>PlatformAccessManager</strong> contract.
                Requires your wallet to hold <code className="bg-muted px-1 rounded">ADMIN_ROLE (id 0)</code>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...platformForm}>
                <form onSubmit={platformForm.handleSubmit(onGrantPlatform)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField control={platformForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name (optional)</FormLabel>
                        <FormControl><Input placeholder="e.g. Jane Smith" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={platformForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (optional)</FormLabel>
                        <FormControl><Input placeholder="jane@example.com" type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={platformForm.control} name="walletAddress" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallet Address <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input placeholder="0x…" className="font-mono text-xs" {...field} /></FormControl>
                      <FormDescription className="text-xs">This address will receive the role on-chain.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={platformForm.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform Role <span className="text-destructive">*</span></FormLabel>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {ALL_PLATFORM_ROLES.map((role) => (
                          <button
                            key={role.key}
                            type="button"
                            onClick={() => field.onChange(role.key)}
                            className={cn(
                              "rounded-lg border-2 p-3 text-left transition-all hover:border-primary/60",
                              field.value === role.key ? "border-primary bg-primary/5" : "border-border"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-semibold">{role.label}</p>
                              {role.sensitive && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1 text-amber-600 border-amber-300">Sensitive</Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-snug">{role.description}</p>
                            <p className="text-[10px] font-mono text-muted-foreground mt-1">id: {role.id.toString()}</p>
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {isSensitivePlatform && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>
                        <strong>{selectedPlatformRole}</strong> is a high-privilege role.
                        Double-check the wallet address before submitting. This action triggers an on-chain transaction.
                      </span>
                    </div>
                  )}

                  {isSensitivePlatform ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Grant {selectedPlatformRole} Role
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Role Grant</AlertDialogTitle>
                          <AlertDialogDescription>
                            You are granting <strong>{selectedPlatformRole}</strong> role on the Platform AccessManager.
                            This gives significant platform authority. Verify the address is correct.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={platformForm.handleSubmit(onGrantPlatform)}>
                            Confirm Grant
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button type="submit" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Grant Platform Role
                    </Button>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── GRANT TOKEN ROLE ── */}
        <TabsContent value="grant-token" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-500" />
                Grant Token Role
              </CardTitle>
              <CardDescription className="text-xs">
                Assigns a role on a specific token's <strong>TokenAccessManager</strong>.
                Requires your wallet to hold <code className="bg-muted px-1 rounded">ADMIN_ROLE</code> on that token's AM.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deployedAssets.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <Shield className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No deployed assets — deploy a token first</p>
                </div>
              ) : (
                <Form {...tokenForm}>
                  <form onSubmit={tokenForm.handleSubmit(onGrantToken)} className="space-y-4">
                    <FormField control={tokenForm.control} name="assetId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset / Token <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select deployed token" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {deployedAssets.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs">{a.symbol}</span>
                                  <span className="text-xs text-muted-foreground">{a.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={tokenForm.control} name="walletAddress" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wallet Address <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input placeholder="0x…" className="font-mono text-xs" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={tokenForm.control} name="role" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token Role <span className="text-destructive">*</span></FormLabel>
                        <div className="grid grid-cols-2 gap-2 mt-1 sm:grid-cols-3">
                          {ALL_TOKEN_ROLES.map((role) => (
                            <button
                              key={role.key}
                              type="button"
                              onClick={() => field.onChange(role.key)}
                              className={cn(
                                "rounded-lg border-2 p-3 text-left transition-all hover:border-primary/60",
                                field.value === role.key ? "border-primary bg-primary/5" : "border-border"
                              )}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={cn("inline-flex items-center rounded px-1 py-0.5 text-[10px] font-semibold", TOKEN_ROLE_COLORS[role.key])}>
                                  {role.label}
                                </span>
                                {role.sensitive && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-snug">{role.description}</p>
                              <p className="text-[10px] font-mono text-muted-foreground mt-1">id: {role.id.toString()}</p>
                            </button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {isSensitiveToken && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>
                          <strong>{selectedTokenRole}</strong> is a sensitive token role.
                          {selectedTokenRole === "ENFORCER" && " ENFORCER can bypass compliance and freeze state — grant only for regulatory recovery ops."}
                          {selectedTokenRole === "ADMIN" && " ADMIN can assign all other roles on this token."}
                        </span>
                      </div>
                    )}

                    {isSensitiveToken ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button type="button" className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Grant {selectedTokenRole} Role
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Sensitive Role Grant</AlertDialogTitle>
                            <AlertDialogDescription>
                              Granting <strong>{selectedTokenRole}</strong> on this token gives elevated access.
                              Confirm the wallet address is correct and the grant is authorized.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={tokenForm.handleSubmit(onGrantToken)}>
                              Confirm Grant
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button type="submit" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Grant Token Role
                      </Button>
                    )}
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ROLE REFERENCE ── */}
        <TabsContent value="roles" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Platform Roles — PlatformAccessManager</CardTitle>
              <CardDescription className="text-xs">Managed by QBridge · Controls platform-level operations</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {ALL_PLATFORM_ROLES.map((role) => (
                <div key={role.key} className="py-3 flex items-start gap-3">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono shrink-0 mt-0.5">
                    id: {role.id.toString()}
                  </code>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{role.label}</p>
                      {role.sensitive && <Badge variant="outline" className="text-[10px] h-4 px-1 text-amber-600 border-amber-300">Sensitive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Token Roles — TokenAccessManager (per token)</CardTitle>
              <CardDescription className="text-xs">One AccessManager per deployed token · Managed by issuer (ADMIN_ROLE)</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {ALL_TOKEN_ROLES.map((role) => (
                <div key={role.key} className="py-3 flex items-start gap-3">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono shrink-0 mt-0.5">
                    id: {role.id.toString()}
                  </code>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold", TOKEN_ROLE_COLORS[role.key])}>
                        {role.label}
                      </span>
                      {role.sensitive && <Badge variant="outline" className="text-[10px] h-4 px-1 text-amber-600 border-amber-300">Sensitive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Member Card ──────────────────────────────────────────────
function MemberCard({
  member,
  expanded,
  onToggle,
}: {
  member: TeamMember;
  expanded: boolean;
  onToggle: () => void;
}) {
  const platformColor = member.platformRole
    ? PLATFORM_ROLE_COLORS[member.platformRole] ?? "text-muted-foreground"
    : "text-muted-foreground";

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
            {member.name?.charAt(0).toUpperCase() ?? "?"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold">{member.name ?? "Unnamed"}</p>
              {member.platformRole && (
                <Badge
                  variant="outline"
                  className={cn("text-[10px] h-5 px-1.5", platformColor)}
                >
                  {PLATFORM_ROLE_LABELS[member.platformRole as PlatformRole]}
                </Badge>
              )}
              {!member.isActive && (
                <Badge variant="secondary" className="text-[10px] h-5">Inactive</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs font-mono text-muted-foreground">
                {shortAddr(member.walletAddress)}
              </span>
              {member.email && (
                <span className="text-xs text-muted-foreground hidden sm:inline">{member.email}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {member.tokenRoles.length} token role{member.tokenRoles.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={onToggle}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Expanded token roles */}
        {expanded && (
          <div className="mt-4 space-y-2 border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Token Roles
            </p>
            {member.tokenRoles.length === 0 ? (
              <p className="text-xs text-muted-foreground">No token roles assigned</p>
            ) : (
              member.tokenRoles.map((tr, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold", TOKEN_ROLE_COLORS[tr.role])}>
                      {TOKEN_ROLE_LABELS[tr.role]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      on <span className="font-medium font-mono">{tr.assetSymbol}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                      Granted {new Date(tr.grantedAt).toLocaleDateString()}
                    </span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke Role</AlertDialogTitle>
                          <AlertDialogDescription>
                            Revoke <strong>{TOKEN_ROLE_LABELS[tr.role]}</strong> from{" "}
                            <strong>{member.name ?? shortAddr(member.walletAddress)}</strong> on{" "}
                            <strong>{tr.assetName}</strong>? This calls{" "}
                            <code className="bg-muted px-1 rounded">revokeRole()</code> on the token AccessManager.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                            Revoke Role
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
