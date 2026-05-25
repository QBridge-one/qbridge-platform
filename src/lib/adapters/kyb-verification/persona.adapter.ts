// ============================================================
// lib/adapters/kyb-verification/persona.adapter.ts
// Persona inquiry API adapter.
//
// Required env:
//   PERSONA_API_KEY       — persona_sandbox_… or persona_production_…
//   PERSONA_TEMPLATE_ID   — itmpl_… (inquiry template)
//   PERSONA_WEBHOOK_SECRET — webhook signing secret
//
// Persona API docs:
//   https://docs.withpersona.com/reference/create-an-inquiry
//   https://docs.withpersona.com/docs/webhooks
// ============================================================

import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { KybVerificationPort } from "../../ports/kyb-verification.port";
import type {
  CreateCaseInput,
  CreateCaseResult,
  KybCaseStatus,
  KybVerificationEvent,
} from "../../core/kyb-verification";
import { providerNotInitialized, webhookSignatureInvalid } from "../../core/errors";

const PERSONA_API = "https://withpersona.com/api/v1";
const PERSONA_VERSION = "2023-01-05";

function getConfig() {
  const apiKey = process.env.PERSONA_API_KEY?.trim();
  const templateId = process.env.PERSONA_TEMPLATE_ID?.trim();
  const webhookSecret = process.env.PERSONA_WEBHOOK_SECRET?.trim();
  if (!apiKey) throw providerNotInitialized("Persona (missing PERSONA_API_KEY)");
  if (!templateId) throw providerNotInitialized("Persona (missing PERSONA_TEMPLATE_ID)");
  return { apiKey, templateId, webhookSecret: webhookSecret ?? "" };
}

function mapPersonaStatus(status: string): KybCaseStatus {
  switch (status) {
    case "created":
      return "created";
    case "pending":
    case "processing":
      return "pending";
    case "needs_review":
      return "needs_review";
    case "approved":
      return "approved";
    case "declined":
      return "declined";
    case "expired":
      return "expired";
    case "failed":
    case "errored":
      return "failed";
    default:
      return "pending";
  }
}

interface PersonaInquiryResponse {
  data: {
    id: string;
    attributes: {
      status: string;
      "reference-id"?: string;
      [k: string]: unknown;
    };
  };
  meta?: {
    "session-token"?: string;
  };
}

interface PersonaWebhookPayload {
  data: {
    type: string;
    id: string;
    attributes: {
      name: string;
      payload: {
        data: {
          type: string;
          id: string;
          attributes: {
            status: string;
            "reference-id"?: string;
            [k: string]: unknown;
          };
        };
      };
    };
  };
}

class PersonaKybAdapter implements KybVerificationPort {
  async createCase(input: CreateCaseInput): Promise<CreateCaseResult> {
    const { apiKey, templateId } = getConfig();

    const res = await fetch(`${PERSONA_API}/inquiries`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Persona-Version": PERSONA_VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            "inquiry-template-id": templateId,
            "reference-id": input.orgId,
            "note": `QBridge issuer application for ${input.orgName}`,
            ...(input.contactEmail
              ? { "fields": { "email-address": { type: "string", value: input.contactEmail } } }
              : {}),
          },
        },
      }),
    });

    if (!res.ok) {
      let detail = `${res.status} ${res.statusText}`;
      try {
        const err = await res.json();
        const msg = err?.errors?.[0]?.detail ?? err?.errors?.[0]?.title;
        if (msg) detail = `${detail} — ${msg}`;
      } catch { /* ignore */ }
      throw new Error(`Persona createCase failed: ${detail}`);
    }

    const body = (await res.json()) as PersonaInquiryResponse;
    return {
      caseId: body.data.id,
      sessionToken: body.meta?.["session-token"] ?? "",
      status: mapPersonaStatus(body.data.attributes.status),
    };
  }

  async getCaseStatus(caseId: string): Promise<KybCaseStatus> {
    const { apiKey } = getConfig();
    const res = await fetch(`${PERSONA_API}/inquiries/${caseId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Persona-Version": PERSONA_VERSION,
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`Persona getCaseStatus failed: ${res.status}`);
    const body = (await res.json()) as PersonaInquiryResponse;
    return mapPersonaStatus(body.data.attributes.status);
  }

  async handleWebhook(request: Request): Promise<KybVerificationEvent> {
    const { webhookSecret } = getConfig();
    const rawBody = await request.text();
    const sigHeader = request.headers.get("persona-signature") ?? "";

    if (webhookSecret) {
      verifySignature(rawBody, sigHeader, webhookSecret);
    }

    const payload = JSON.parse(rawBody) as PersonaWebhookPayload;
    const eventName = payload.data.attributes.name;
    const inquiry = payload.data.attributes.payload.data;
    const inquiryId = inquiry.id;
    const referenceId = inquiry.attributes["reference-id"] ?? "";
    const status = mapPersonaStatus(inquiry.attributes.status);

    return {
      caseId: inquiryId,
      orgId: referenceId,
      status,
      providerEvent: eventName,
      raw: payload as unknown as Record<string, unknown>,
    };
  }
}

function verifySignature(body: string, sigHeader: string, secret: string): void {
  // Persona-Signature: t=<timestamp>,v1=<hex_digest>
  const parts = sigHeader.split(",").reduce<Record<string, string>>((acc, part) => {
    const [k, ...rest] = part.split("=");
    if (k && rest.length > 0) acc[k.trim()] = rest.join("=").trim();
    return acc;
  }, {});

  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) throw webhookSignatureInvalid();

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(v1, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw webhookSignatureInvalid();
  }
}

export const personaKybAdapter = new PersonaKybAdapter();
