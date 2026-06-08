"use client";

// ============================================================
// components/ops/PermissionsManager.tsx
//
// Ops "Platform Permissions" tool. Wires a singleton contract's
// function to a PlatformAccessManager role via setTargetFunctionRole,
// composing the generated AM hooks. Contracts come from the registry,
// functions/selectors from manageable-targets, roles from roles.ts —
// so admins never hand-type a selector or a numeric role id.
//
// On-chain, setTargetFunctionRole is SUPER_ADMIN-only; the connected
// wallet must hold role 0 or the tx reverts AccessManagedUnauthorized.
// ============================================================

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, ArrowRight } from "lucide-react";
import { MANAGEABLE_TARGETS } from "@/lib/contracts/manageable-targets";
import { PLATFORM_ROLES, getPlatformRoleName } from "@/lib/contracts/roles";
import { useContractAddress } from "@/lib/hooks/useContracts";
import {
  useGetTargetFunctionRole,
  useSetTargetFunctionRole,
} from "@/lib/generated/platform-access-manager";

const ZERO_ADDR = "0x0000000000000000000000000000000000000000" as const;
const ROLE_OPTIONS = Object.entries(PLATFORM_ROLES) as [string, bigint][];

export function PermissionsManager() {
  const [targetKey, setTargetKey] = useState(MANAGEABLE_TARGETS[0].key);
  const target = useMemo(
    () => MANAGEABLE_TARGETS.find((t) => t.key === targetKey) ?? MANAGEABLE_TARGETS[0],
    [targetKey],
  );
  const [fnName, setFnName] = useState(target.functions[0]?.name ?? "");
  const fn = useMemo(
    () => target.functions.find((f) => f.name === fnName) ?? target.functions[0],
    [target, fnName],
  );
  const [roleId, setRoleId] = useState<string>(PLATFORM_ROLES.PUBLIC.toString());

  const targetAddress = useContractAddress(targetKey);
  const selector = fn?.selector ?? "0x00000000";

  const current = useGetTargetFunctionRole(undefined, (targetAddress ?? ZERO_ADDR) as `0x${string}`, selector);
  const currentRoleId = current.data as bigint | undefined;

  const { setTargetFunctionRole, isLoading, error, reset } = useSetTargetFunctionRole();
  const [done, setDone] = useState(false);

  const onTargetChange = (key: string) => {
    setTargetKey(key);
    const t = MANAGEABLE_TARGETS.find((x) => x.key === key);
    setFnName(t?.functions[0]?.name ?? "");
    setDone(false);
    reset();
  };

  const onApply = async () => {
    if (!targetAddress || !fn) return;
    setDone(false);
    try {
      await setTargetFunctionRole({
        target: targetAddress,
        selectors: [fn.selector],
        roleId: BigInt(roleId),
      });
      setDone(true);
      current.refetch();
    } catch {
      /* surfaced via error state */
    }
  };

  const noChange = currentRoleId !== undefined && currentRoleId === BigInt(roleId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Function → role</CardTitle>
        <CardDescription>
          Choose which PlatformAccessManager role is required to call a function
          on a platform contract. Public means anyone passes the AccessManager
          gate (the contract&apos;s own checks, e.g. IssuerRegistry, still apply).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Contract">
            <Select value={targetKey} onValueChange={onTargetChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MANAGEABLE_TARGETS.map((t) => (
                  <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
              {targetAddress ?? "not configured on this chain"}
            </p>
          </Field>

          <Field label="Function">
            <Select value={fnName} onValueChange={(v) => { setFnName(v); setDone(false); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {target.functions.map((f) => (
                  <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">{selector}</p>
          </Field>
        </div>

        <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-3 text-sm">
          <span className="text-muted-foreground">Currently requires</span>
          <Badge variant="secondary">
            {currentRoleId === undefined
              ? (current.isFetching ? "…" : "—")
              : getPlatformRoleName(currentRoleId)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
          <Field label="Set required role to">
            <Select value={roleId} onValueChange={(v) => { setRoleId(v); setDone(false); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map(([name, id]) => (
                  <SelectItem key={name} value={id.toString()}>
                    {name} {name !== "PUBLIC" && name !== "SUPER_ADMIN" ? `(${id})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Button onClick={onApply} disabled={isLoading || !targetAddress || noChange}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
            {noChange ? "Already set" : "Apply"}
          </Button>
        </div>

        <div className="flex items-start gap-2 rounded-md border border-amber-500/40 p-3 text-xs text-amber-600 dark:text-amber-400">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Must be signed by a wallet holding <strong>SUPER_ADMIN</strong> on the
            PlatformAccessManager, or the transaction reverts.
          </span>
        </div>

        {error && <p className="text-sm text-destructive">{error.message}</p>}
        {done && !error && (
          <p className="text-sm text-emerald-600">Permission updated. Re-checking current role…</p>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium leading-none">{label}</label>
      {children}
    </div>
  );
}
