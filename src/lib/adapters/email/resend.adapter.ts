// ============================================================
// lib/adapters/email/resend.adapter.ts
// Resend EmailPort via plain fetch — no SDK dependency.
//
// Required env:
//   RESEND_API_KEY  — secret from resend.com/api-keys
//   EMAIL_FROM      — default "from" identity (e.g.
//                     "QBridge <notifications@mail.qbridge.one>"),
//                     must be on a verified sending domain.
//
// Failure mode: throws on non-2xx so the notification dispatcher
// records the error via NotificationPort.markEmailFailed and retries.
// ============================================================

import "server-only";

import type {
  EmailMessage,
  EmailPort,
  EmailSendResult,
} from "../../ports/email.port";
import { providerNotInitialized } from "../../core/errors";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

interface ResendSuccessBody {
  id: string;
}

interface ResendErrorBody {
  name?: string;
  message?: string;
  statusCode?: number;
}

class ResendEmailAdapter implements EmailPort {
  async send(message: EmailMessage): Promise<EmailSendResult> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) throw providerNotInitialized("Resend");
    const defaultFrom = process.env.EMAIL_FROM?.trim();
    const from = message.from ?? defaultFrom;
    if (!from) {
      throw providerNotInitialized(
        "Resend (missing EMAIL_FROM and no per-message override)",
      );
    }

    const body: Record<string, unknown> = {
      from,
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      html: message.html,
    };
    if (message.text) body.text = message.text;
    if (message.replyTo) body.reply_to = message.replyTo;
    if (message.headers) body.headers = message.headers;
    if (message.tags) {
      body.tags = Object.entries(message.tags).map(([name, value]) => ({
        name,
        value,
      }));
    }

    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let detail = `${res.status} ${res.statusText}`;
      try {
        const err = (await res.json()) as ResendErrorBody;
        if (err.message) detail = `${detail} — ${err.message}`;
      } catch {
        // Body not JSON — stick with status text.
      }
      throw new Error(`Resend send failed: ${detail}`);
    }

    const ok = (await res.json()) as ResendSuccessBody;
    return { id: ok.id };
  }
}

export const resendEmailAdapter = new ResendEmailAdapter();
