"use client";

// ============================================================
// app/dashboard/assets/new/_components/step-documents.tsx
// Step 3 — Legal documents, SPV info, regulatory exemption
// ============================================================

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { documentsSchema, type DocumentsSchema } from "@/lib/validators/asset-wizard";
import type { DocumentsFormData } from "@/types/assets";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Upload,
  X,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentUploadState {
  file: File | null;
  status: "idle" | "uploading" | "done" | "error";
}

interface DocumentField {
  key: keyof Pick<
    DocumentsFormData,
    | "offeringMemorandum"
    | "subscriptionAgreement"
    | "legalOpinion"
    | "auditReport"
  >;
  label: string;
  description: string;
  required: boolean;
  accept: string;
}

const DOCUMENT_FIELDS: DocumentField[] = [
  {
    key: "offeringMemorandum",
    label: "Offering Memorandum / Prospectus",
    description:
      "Primary disclosure document describing the investment opportunity.",
    required: true,
    accept: ".pdf,.doc,.docx",
  },
  {
    key: "subscriptionAgreement",
    label: "Subscription Agreement",
    description:
      "Legal agreement between the issuer and investors for token purchase.",
    required: true,
    accept: ".pdf,.doc,.docx",
  },
  {
    key: "legalOpinion",
    label: "Legal Opinion Letter",
    description:
      "Attorney opinion confirming the legality of the token offering.",
    required: false,
    accept: ".pdf,.doc,.docx",
  },
  {
    key: "auditReport",
    label: "Audit / Reserve Report",
    description:
      "Third-party audit confirming asset backing or financial statements.",
    required: false,
    accept: ".pdf,.xlsx,.csv",
  },
];

const REGULATORY_EXEMPTIONS = [
  { value: "REG_D_506B", label: "Reg D 506(b) — US Accredited Investors" },
  { value: "REG_D_506C", label: "Reg D 506(c) — US Verified Accredited" },
  { value: "REG_S", label: "Reg S — Non-US Investors" },
  { value: "REG_CF", label: "Regulation Crowdfunding (Reg CF)" },
  { value: "NI_45_106", label: "NI 45-106 — Canadian Accredited" },
  { value: "MICA", label: "MiCA — EU Markets in Crypto-Assets" },
  { value: "NONE", label: "None / Other" },
];

interface StepDocumentsProps {
  defaultValues?: Partial<DocumentsFormData>;
  onNext: (data: DocumentsFormData) => void;
  onBack: () => void;
}

export function StepDocuments({ defaultValues, onNext, onBack }: StepDocumentsProps) {
  const form = useForm<DocumentsSchema>({
    resolver: zodResolver(documentsSchema),
    defaultValues: {
      spvEntityName: defaultValues?.spvEntityName ?? "",
      spvJurisdiction: defaultValues?.spvJurisdiction ?? "",
      regulatoryExemption: defaultValues?.regulatoryExemption ?? "",
    },
  });

  // File state managed separately (Zod doesn't handle File objects well)
  const [files, setFiles] = useState<Record<string, DocumentUploadState>>({
    offeringMemorandum: { file: null, status: "idle" },
    subscriptionAgreement: { file: null, status: "idle" },
    legalOpinion: { file: null, status: "idle" },
    auditReport: { file: null, status: "idle" },
  });

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileSelect = (key: string, file: File) => {
    // In production: upload to IPFS/S3 and store CID/URL
    setFiles((prev) => ({
      ...prev,
      [key]: { file, status: "done" },
    }));
  };

  const handleFileClear = (key: string) => {
    setFiles((prev) => ({
      ...prev,
      [key]: { file: null, status: "idle" },
    }));
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key]!.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const onSubmit = (data: DocumentsSchema) => {
    // Validate required documents
    const requiredMissing = DOCUMENT_FIELDS.filter(
      (f) => f.required && !files[f.key]?.file
    );
    if (requiredMissing.length > 0) {
      // In a real app, set custom errors here
      return;
    }

    const fullData: DocumentsFormData = {
      ...data,
      offeringMemorandum: files.offeringMemorandum?.file ?? null,
      subscriptionAgreement: files.subscriptionAgreement?.file ?? null,
      legalOpinion: files.legalOpinion?.file ?? null,
      auditReport: files.auditReport?.file ?? null,
    };

    onNext(fullData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* ── Info banner ── */}
        <div className="flex items-start gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Documents are reviewed by the QBridge compliance team before your
            asset goes live. Required documents must be provided. Files will be
            stored with IPFS content hashes anchored on-chain.
          </span>
        </div>

        {/* ── Document uploads ── */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Legal Documents</h3>

          <div className="space-y-3">
            {DOCUMENT_FIELDS.map((docField) => {
              const fileState = files[docField.key];
              const hasFile = fileState?.file != null;

              return (
                <Card
                  key={docField.key}
                  className={cn(
                    "transition-colors",
                    hasFile && "border-primary/40 bg-primary/5"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                          hasFile
                            ? "border-primary/40 bg-primary/10"
                            : "border-border bg-muted"
                        )}
                      >
                        {hasFile ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{docField.label}</p>
                          {docField.required ? (
                            <Badge
                              variant="destructive"
                              className="text-[10px] h-4 px-1"
                            >
                              Required
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] h-4 px-1"
                            >
                              Optional
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {docField.description}
                        </p>

                        {hasFile && fileState.file ? (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-foreground font-medium truncate max-w-[200px]">
                              {fileState.file.name}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatFileSize(fileState.file.size)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleFileClear(docField.key)}
                              className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Remove file"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">
                            Accepts: {docField.accept.split(",").join(", ")} · Max 25 MB
                          </p>
                        )}
                      </div>

                      {/* Upload button */}
                      <div className="shrink-0">
                        <input
                          ref={(el) => {
                            fileInputRefs.current[docField.key] = el;
                          }}
                          type="file"
                          accept={docField.accept}
                          className="hidden"
                          id={`file-${docField.key}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(docField.key, file);
                          }}
                        />
                        <Button
                          type="button"
                          variant={hasFile ? "outline" : "secondary"}
                          size="sm"
                          onClick={() =>
                            fileInputRefs.current[docField.key]?.click()
                          }
                        >
                          <Upload className="mr-1.5 h-3.5 w-3.5" />
                          {hasFile ? "Replace" : "Upload"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* ── SPV Info ── */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">SPV / Legal Structure</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Optional — provide if the asset is held via a Special Purpose Vehicle.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="spvEntityName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SPV Entity Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme RE SPV Ltd." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="spvJurisdiction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SPV Jurisdiction</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Cayman Islands, Ontario"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* ── Regulatory Exemption ── */}
        <FormField
          control={form.control}
          name="regulatoryExemption"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Regulatory Exemption</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select applicable exemption" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {REGULATORY_EXEMPTIONS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The primary regulatory exemption under which this offering is
                made. This informs compliance rule defaults in the next step.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Actions ── */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button type="submit" size="lg">
            Continue to Compliance
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
