"use client";

// ============================================================
// Step 2 — Roles & Treasury
// Per-deal role holders + timelock delay (TokenAccessManager + Timelock).
// ============================================================

import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Info, Wallet } from "lucide-react";
import { AddressField, NumberField, SectionTitle } from "./fields";
import { useWallet } from "@/lib/hooks/useWallet";
import type { DealWizardValues } from "@/lib/validators/deal-wizard";

export function StepRoles() {
  const { setValue } = useFormContext<DealWizardValues>();
  const { address } = useWallet();

  const fillMine = (name: "dealAdmin" | "issuerExecutor" | "treasury" | "spvLegalEntity") => {
    if (address) setValue(name, address, { shouldValidate: true });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-2 rounded-md border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          These addresses receive on-chain authority on the deployed cluster
          (TokenAccessManager + Timelock). Use multisigs/hardware wallets where
          possible. Your connected wallet:{" "}
          {address ? (
            <code className="font-mono">{address}</code>
          ) : (
            <span className="italic">not connected</span>
          )}
        </span>
      </div>

      <div className="space-y-4">
        <SectionTitle title="Deal Roles" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <AddressField name="dealAdmin" label="Deal Admin" required description="DEAL_ADMIN — top-level per-deal authority." />
            <UseMine onClick={() => fillMine("dealAdmin")} disabled={!address} />
          </div>
          <AddressField
            name="platformProposer"
            label="Platform Proposer"
            required
            description="PLATFORM_PROPOSER — proposes timelock operations."
          />
          <div className="space-y-1.5">
            <AddressField name="issuerExecutor" label="Issuer Executor" required description="ISSUER_EXECUTOR — executes timelock operations." />
            <UseMine onClick={() => fillMine("issuerExecutor")} disabled={!address} />
          </div>
          <NumberField
            name="timelockMinDelay"
            label="Timelock Min Delay"
            required
            suffix="seconds"
            description="Governance delay for the per-deal timelock (0 = no delay)."
          />
        </div>
      </div>

      <div className="space-y-4">
        <SectionTitle title="Treasury & Legal Entity" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <AddressField name="treasury" label="Treasury" required description="Receives/holds minted tokens." />
            <UseMine onClick={() => fillMine("treasury")} disabled={!address} />
          </div>
          <div className="space-y-1.5">
            <AddressField name="spvLegalEntity" label="SPV Legal Entity" required description="On-chain address representing the SPV." />
            <UseMine onClick={() => fillMine("spvLegalEntity")} disabled={!address} />
          </div>
        </div>
      </div>
    </div>
  );
}

function UseMine({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onClick} disabled={disabled}>
      <Wallet className="mr-1 h-3 w-3" />
      Use my wallet
    </Button>
  );
}
