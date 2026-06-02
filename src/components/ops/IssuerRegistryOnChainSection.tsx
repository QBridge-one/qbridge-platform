"use client";

// ============================================================
// IssuerRegistryOnChainSection
// Ops drawer panel: off-chain registration context + on-chain reads
// and registerIssuer via transactionService (mirrors TeamMemberSheet
// chain-role UX — wrong network, loading, tx hash + Etherscan).
// ============================================================

import { useState } from "react";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { useChainId, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Address, Hex } from "@/lib/core/types";
import { useIssuerRegistrationContext } from "@/lib/hooks/useIssuerRegistrationContext";
import { useIssuerRegistryAddress } from "@/lib/hooks/useContracts";
import {
  useGetIssuer,
  useIsApproved,
  useRegisterIssuer,
} from "@/lib/generated/issuer-registry";
import type { RegisterIssuerPayload } from "@/lib/contracts/issuer-registry-payload";
import { explorerAddressUrl, explorerTxUrl } from "@/lib/explorer-urls";
import { notifyTxSuccess } from "@/lib/notify-tx-success";

const EXPECTED_CHAIN_ID =
  process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK === "mainnet" ? 1 : 11155111;

const ISSUER_STATUS_LABEL: Record<number, string> = {
  0: "None",
  1: "Active",
  2: "Suspended",
  3: "Revoked",
};

function truncateHex(value: string, head = 10, tail = 8): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function WrongNetworkHint({ expectedChainId }: { expectedChainId: number }) {
  const { switchChain, isPending } = useSwitchChain();
  const name = expectedChainId === 1 ? "Ethereum" : expectedChainId === 137 ? "Polygon" : "Sepolia";
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-amber-400/40 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
      <span>Wrong network — IssuerRegistry lives on {name}.</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-6 px-2 text-[11px]"
        disabled={isPending}
        onClick={() => switchChain({ chainId: expectedChainId })}
      >
        {isPending ? "Switching…" : `Switch to ${name}`}
      </Button>
    </div>
  );
}

function TxStatus({
  loading,
  txHash,
  chainId,
  onDismiss,
}: {
  loading: boolean;
  txHash: Hex | null;
  chainId: number;
  onDismiss: () => void;
}) {
  if (txHash) {
    const url = explorerTxUrl(chainId, txHash);
    return (
      <div className="flex flex-col gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/30">
        <div className="flex items-start gap-2">
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
              KYB verified on-chain
            </p>
            <p className="text-xs text-emerald-700/90 dark:text-emerald-300/90">
              The verification was included in a block.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-6">
          {url ? (
            <Button variant="secondary" size="sm" className="h-7 text-xs" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1 h-3 w-3" />
                View transaction
              </a>
            </Button>
          ) : null}
          <span className="break-all font-mono text-xs text-emerald-800 dark:text-emerald-200">
            {truncateHex(txHash, 18, 10)}
          </span>
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div
        className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3 py-2"
        role="status"
        aria-live="polite"
      >
        <Loader2
          className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-muted-foreground"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground">On-chain verification in progress</p>
          <p className="text-xs text-muted-foreground">
            Preparing the transaction — your wallet will ask you to sign. Gas may apply.
          </p>
        </div>
      </div>
    );
  }
  return null;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-start gap-2">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="break-all font-mono text-xs">{value}</dd>
    </div>
  );
}

export function IssuerRegistryOnChainSection({
  orgId,
  onRegistered,
}: {
  orgId: string;
  onRegistered?: () => void;
}) {
  const registryAddress = useIssuerRegistryAddress();
  const walletChainId = useChainId();
  const wrongChain = walletChainId !== EXPECTED_CHAIN_ID;

  const { data: context, isLoading: contextLoading, error: contextError, refetch: refetchContext } =
    useIssuerRegistrationContext(orgId);

  const issuerWallet = context?.issuerAdmin?.walletAddress ?? null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          On-chain KYB verification
        </h3>
      </div>

      <p className="text-xs text-muted-foreground">
        Off-chain application approval does not verify KYB on-chain. This step records the issuer
        on IssuerRegistry via a separate signed transaction.
      </p>

      {!registryAddress ? (
        <Alert>
          <AlertDescription className="text-xs">
            IssuerRegistry is not configured for this chain. Set{" "}
            <code className="text-[11px]">NEXT_PUBLIC_ISSUER_REGISTRY_SEPOLIA</code> and reload.
          </AlertDescription>
        </Alert>
      ) : null}

      {contextLoading ? (
        <p className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Loading registration context…
        </p>
      ) : context ? (
        <dl className="space-y-2 rounded-md border bg-muted/30 p-3">
          {context.issuerAdmin ? (
            <>
              <InfoRow
                label="Admin"
                value={
                  context.issuerAdmin.displayName
                    ? `${context.issuerAdmin.displayName} (${context.issuerAdmin.email})`
                    : context.issuerAdmin.email
                }
              />
              <InfoRow
                label="Wallet"
                value={
                  context.issuerAdmin.walletAddress ? (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span>{truncateHex(context.issuerAdmin.walletAddress)}</span>
                      {explorerAddressUrl(EXPECTED_CHAIN_ID, context.issuerAdmin.walletAddress) ? (
                        <a
                          href={
                            explorerAddressUrl(
                              EXPECTED_CHAIN_ID,
                              context.issuerAdmin.walletAddress,
                            )!
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 font-sans underline underline-offset-2"
                        >
                          Etherscan
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </span>
                  ) : (
                    <span className="font-sans text-muted-foreground">Not linked</span>
                  )
                }
              />
            </>
          ) : (
            <InfoRow label="Admin" value={<span className="font-sans text-muted-foreground">—</span>} />
          )}
          <InfoRow
            label="Entity ID"
            value={
              <span title="keccak256(Clerk org id) — stable identifier for this workspace on-chain">
                {truncateHex(context.entityId)}
              </span>
            }
          />
          {context.kybDocumentHash ? (
            <InfoRow
              label="KYB hash"
              value={
                <span title="Hash of the KYB application snapshot — will later use Sumsub verification bundle">
                  {truncateHex(context.kybDocumentHash)}
                </span>
              }
            />
          ) : null}
        </dl>
      ) : null}

      {context && context.registrationBlockers.length > 0 ? (
        <ul className="space-y-1 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
          {context.registrationBlockers.map((b) => (
            <li key={b}>• {b}</li>
          ))}
        </ul>
      ) : null}

      {contextError ? (
        <p className="text-xs text-destructive">{contextError.message}</p>
      ) : null}

      {issuerWallet && registryAddress ? (
        <IssuerRegistryChainActions
          orgId={orgId}
          issuerWallet={issuerWallet}
          registryAddress={registryAddress}
          registerPayload={context?.registerIssuer ?? null}
          wrongChain={wrongChain}
          onRegistered={() => {
            void refetchContext();
            onRegistered?.();
          }}
        />
      ) : null}
    </section>
  );
}

function IssuerRegistryChainActions({
  orgId,
  issuerWallet,
  registryAddress,
  registerPayload,
  wrongChain,
  onRegistered,
}: {
  orgId: string;
  issuerWallet: Address;
  registryAddress: Address;
  registerPayload: RegisterIssuerPayload | null;
  wrongChain: boolean;
  onRegistered: () => void;
}) {
  const {
    data: isApproved,
    isLoading: isApprovedLoading,
    refetch: refetchApproved,
  } = useIsApproved(registryAddress, issuerWallet, EXPECTED_CHAIN_ID);

  const {
    data: issuerRecord,
    isLoading: issuerLoading,
    refetch: refetchIssuer,
  } = useGetIssuer(registryAddress, issuerWallet, EXPECTED_CHAIN_ID);

  const { registerIssuer, isLoading: registering, error: registerError, reset: resetRegister } =
    useRegisterIssuer();

  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmedTxHash, setConfirmedTxHash] = useState<Hex | null>(null);

  const chainLoading = isApprovedLoading || issuerLoading;
  const alreadyRegistered = isApproved === true;

  const canRegister =
    Boolean(registerPayload) && !wrongChain && !registering && !alreadyRegistered;

  async function handleRegister() {
    if (!registerPayload || wrongChain) return;
    setLocalError(null);
    setConfirmedTxHash(null);
    resetRegister();
    try {
      const hash = await registerIssuer(registerPayload);
      if (hash) {
        const txHash = hash as Hex;
        setConfirmedTxHash(txHash);
        notifyTxSuccess("KYB verified on-chain", EXPECTED_CHAIN_ID, txHash);

        // Notify the server so it can cache the chainRegistration
        // snapshot in Clerk metadata + fire workspace_active to the
        // issuer admins. Failure here doesn't undo the on-chain tx —
        // just surfaces an error the reviewer can retry.
        try {
          const res = await fetch(
            `/api/ops/issuers/${encodeURIComponent(orgId)}/registry/confirm`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ txHash, chainId: EXPECTED_CHAIN_ID }),
            },
          );
          if (!res.ok) {
            const data = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            setLocalError(
              data.error
                ? `On-chain tx succeeded but recording it failed: ${data.error}`
                : "On-chain tx succeeded but the server failed to record it.",
            );
          }
        } catch (e) {
          setLocalError(
            e instanceof Error
              ? `On-chain tx succeeded but recording it failed: ${e.message}`
              : "On-chain tx succeeded but the server failed to record it.",
          );
        }

        await Promise.all([refetchApproved(), refetchIssuer()]);
        onRegistered();
      }
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Registration failed");
    }
  }

  const errMsg = localError ?? registerError?.message;

  return (
    <>
      {alreadyRegistered ? (
        <Badge
          variant="outline"
          className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
        >
          KYB verified on-chain
        </Badge>
      ) : isApproved === false ? (
        <Badge variant="outline" className="text-xs">
          Not verified on-chain
        </Badge>
      ) : null}

      {chainLoading ? (
        <p className="text-xs text-muted-foreground">Reading on-chain status…</p>
      ) : issuerRecord ? (
        <dl className="space-y-2 rounded-md border bg-muted/30 p-3">
          <InfoRow
            label="Status"
            value={
              ISSUER_STATUS_LABEL[Number(issuerRecord.status)] ??
              `Unknown (${String(issuerRecord.status)})`
            }
          />
          {issuerRecord.entityId && issuerRecord.entityId !== `0x${"0".repeat(64)}` ? (
            <InfoRow label="On-chain entity" value={truncateHex(issuerRecord.entityId)} />
          ) : null}
        </dl>
      ) : null}

      {wrongChain ? <WrongNetworkHint expectedChainId={EXPECTED_CHAIN_ID} /> : null}

      {errMsg ? <p className="text-xs text-destructive">{errMsg}</p> : null}

      <TxStatus
        loading={registering}
        txHash={confirmedTxHash}
        chainId={EXPECTED_CHAIN_ID}
        onDismiss={() => setConfirmedTxHash(null)}
      />

      {!alreadyRegistered && registerPayload ? (
        <Button
          type="button"
          className="w-full"
          disabled={!canRegister}
          onClick={() => void handleRegister()}
        >
          {registering ? "Verifying…" : "Verify KYB on-chain"}
        </Button>
      ) : alreadyRegistered ? (
        <p className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          This issuer is already KYB-verified on IssuerRegistry. Suspend or revoke flows are not
          wired in this panel yet.
        </p>
      ) : null}
    </>
  );
}
