// ============================================================
// lib/auth/api.ts
// Tiny adapters between DomainError and Next.js Response.
// Use in route handlers so trust-boundary errors get correct HTTP codes.
// ============================================================

import { NextResponse } from "next/server";
import { DomainError, type DomainErrorCode } from "../core/types";

const STATUS_BY_CODE: Partial<Record<DomainErrorCode, number>> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  ORG_NOT_FOUND: 404,
  MEMBERSHIP_NOT_FOUND: 404,
  INVITE_NOT_FOUND: 404,
  INVITE_ALREADY_EXISTS: 409,
  ISSUER_KYB_CONFLICT: 409,
  WALLET_LINK_INVALID: 400,
  WEBHOOK_SIGNATURE_INVALID: 400,
  ADAPTER_NOT_IMPLEMENTED: 501,
  PROVIDER_NOT_INITIALIZED: 503,
};

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof DomainError) {
    const status = STATUS_BY_CODE[err.code] ?? 500;
    return NextResponse.json({ error: err.message, code: err.code }, { status });
  }
  const message = err instanceof Error ? err.message : "Internal error";
  return NextResponse.json({ error: message, code: "UNKNOWN" }, { status: 500 });
}
