"use client";

// ============================================================
// app/workspace/assets/new/_components/step-review.tsx
// Step 5 — Full summary before submission to platform review
// ============================================================

import { useState } from "react";
import type { AssetWizardState } from "@/types/assets";
import {
  ASSET_TYPE_LABELS,
  JURISDICTIONS,
  KYC_TIERS,
  TRANSFER_MODES,
} from "@/types/assets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  CheckCircle2,
  Send,
  Loader2,
  Building2,
  Landmark,
  Wheat,
  Coins,
  FileText,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssetType } from "@/types/assets";

const ASSET_TYPE_ICONS: Record<AssetType, React.ElementType> = {
  REAL_ESTATE: Building2,
  PRIVATE_CREDIT: Landmark,
  COMMODITY: Wheat,
  STABLECOIN: Coins,
};

interface StepReviewProps {
  state: AssetWizardState;
  onBack: () => void;
  onSubmit: () => Promise<void>;
}

interface ReviewRowProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  truncate?: boolean;
}

function ReviewRow({ label, value, mono, truncate }: ReviewRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-xs text-muted-foreground shrink-0 w-40">{label}</span>
      <span
        className={cn(
          "text-xs text-right",
          mono && "font-mono",
          truncate && "truncate max-w-[200px]"
        )}
      >
        {value ?? <span className="text-muted-foreground italic">Not set</span>}
      </span>
    </div>
  );
}

export function StepReview({ state, onBack, onSubmit }: StepReviewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { assetDetails, tokenConfig, documents, compliance } = state;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit();
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Submitted for Review</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Your asset <strong>{assetDetails.name}</strong> has been submitted to
            the QBridge compliance team. You&apos;ll be notified once reviewed —
            typically within 2–3 business days.
          </p>
        </div>
        <div className="flex gap-3 mt-4">
          <Button variant="outline" asChild>
            <a href="/workspace">Go to Dashboard</a>
          </Button>
          <Button asChild>
            <a href="/workspace/assets">View My Assets</a>
          </Button>
        </div>
      </div>
    );
  }

  const assetType = assetDetails.assetType;
  const Icon = assetType ? ASSET_TYPE_ICONS[assetType] : Coins;

  const jurisdictionLabel =
    JURISDICTIONS.find((j) => j.value === assetDetails.jurisdiction)?.label ??
    assetDetails.jurisdiction;

  const kycLabel =
    KYC_TIERS.find((k) => k.value === compliance.kycTier)?.label ??
    compliance.kycTier;

  const transferLabel =
    TRANSFER_MODES.find((t) => t.value === compliance.transferMode)?.label ??
    compliance.transferMode;

  // Count uploaded docs
  const docCount = [
    documents.offeringMemorandum,
    documents.subscriptionAgreement,
    documents.legalOpinion,
    documents.auditReport,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-background shadow-sm">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold truncate">{assetDetails.name}</h2>
            <Badge variant="outline" className="font-mono text-xs shrink-0">
              {assetDetails.symbol}
            </Badge>
            {assetType && (
              <Badge variant="secondary" className="text-xs shrink-0">
                {ASSET_TYPE_LABELS[assetType]}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {assetDetails.issuerLegalName} · {jurisdictionLabel}
          </p>
        </div>
        <Badge className="shrink-0">Ready to Submit</Badge>
      </div>

      {/* ── Review sections ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Asset Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Asset Details
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <ReviewRow label="Name" value={assetDetails.name} />
            <ReviewRow
              label="Symbol"
              value={assetDetails.symbol}
              mono
            />
            <ReviewRow
              label="Type"
              value={assetType ? ASSET_TYPE_LABELS[assetType] : undefined}
            />
            <ReviewRow label="Jurisdiction" value={jurisdictionLabel} />
            <ReviewRow
              label="Issuer Entity"
              value={assetDetails.issuerLegalName}
            />
            <ReviewRow
              label="Issuer Wallet"
              value={
                assetDetails.issuerWallet
                  ? `${assetDetails.issuerWallet.slice(0, 10)}…${assetDetails.issuerWallet.slice(-6)}`
                  : undefined
              }
              mono
            />
          </CardContent>
        </Card>

        {/* Token Config */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Coins className="h-4 w-4 text-muted-foreground" />
              Token Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <ReviewRow label="Standard" value="Custom ERC-20 Security" />
            <ReviewRow
              label="Total Supply"
              value={
                tokenConfig.totalSupply
                  ? Number(tokenConfig.totalSupply).toLocaleString()
                  : undefined
              }
            />
            <ReviewRow
              label="Price Per Token"
              value={
                tokenConfig.pricePerToken && tokenConfig.currency
                  ? `${tokenConfig.currency} ${tokenConfig.pricePerToken}`
                  : undefined
              }
            />
            <ReviewRow
              label="Decimals"
              value={tokenConfig.decimals}
              mono
            />
            <ReviewRow
              label="Treasury"
              value={
                tokenConfig.treasuryAddress
                  ? `${tokenConfig.treasuryAddress.slice(0, 10)}…${tokenConfig.treasuryAddress.slice(-6)}`
                  : undefined
              }
              mono
            />
            <ReviewRow
              label="Proof of Backing"
              value={
                <Badge
                  variant={tokenConfig.enableBacking ? "default" : "outline"}
                  className="text-[10px]"
                >
                  {tokenConfig.enableBacking ? "Enabled" : "Disabled"}
                </Badge>
              }
            />
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <ReviewRow
              label="Offering Memorandum"
              value={
                documents.offeringMemorandum ? (
                  <Badge variant="default" className="text-[10px]">Uploaded</Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px]">Missing</Badge>
                )
              }
            />
            <ReviewRow
              label="Subscription Agreement"
              value={
                documents.subscriptionAgreement ? (
                  <Badge variant="default" className="text-[10px]">Uploaded</Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px]">Missing</Badge>
                )
              }
            />
            <ReviewRow
              label="Legal Opinion"
              value={
                documents.legalOpinion ? (
                  <Badge variant="default" className="text-[10px]">Uploaded</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Not provided</Badge>
                )
              }
            />
            <ReviewRow
              label="Audit Report"
              value={
                documents.auditReport ? (
                  <Badge variant="default" className="text-[10px]">Uploaded</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Not provided</Badge>
                )
              }
            />
            {documents.regulatoryExemption && (
              <ReviewRow
                label="Reg Exemption"
                value={documents.regulatoryExemption}
              />
            )}
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Compliance Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <ReviewRow label="KYC Tier" value={kycLabel} />
            <ReviewRow label="Transfer Mode" value={transferLabel} />
            {compliance.holdPeriodDays && (
              <ReviewRow
                label="Hold Period"
                value={`${compliance.holdPeriodDays} days`}
              />
            )}
            {compliance.maxInvestors && (
              <ReviewRow
                label="Max Investors"
                value={compliance.maxInvestors.toLocaleString()}
              />
            )}
            <ReviewRow
              label="Accredited Required"
              value={
                <Badge
                  variant={
                    compliance.requireAccreditedStatus ? "default" : "outline"
                  }
                  className="text-[10px]"
                >
                  {compliance.requireAccreditedStatus ? "Yes" : "No"}
                </Badge>
              }
            />
            {compliance.allowedJurisdictions &&
              compliance.allowedJurisdictions.length > 0 && (
                <ReviewRow
                  label="Allowed"
                  value={compliance.allowedJurisdictions.join(", ")}
                />
              )}
            {compliance.blockedJurisdictions &&
              compliance.blockedJurisdictions.length > 0 && (
                <ReviewRow
                  label="Blocked"
                  value={compliance.blockedJurisdictions.join(", ")}
                />
              )}
          </CardContent>
        </Card>
      </div>

      {/* ── Submission notice ── */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>
          By submitting, you confirm that all provided information is accurate
          and that your entity has completed KYB verification. The QBridge
          compliance team will review your submission before the asset is
          deployed on-chain.
        </span>
      </div>

      {/* ── Actions ── */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="min-w-[160px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit for Review
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
