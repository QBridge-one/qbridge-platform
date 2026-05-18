// ============================================================
// lib/ports/email.port.ts
// Transactional email — abstracted over Resend / Postmark / SES /
// console-log. The notification dispatcher is the only consumer.
//
// Do NOT use this port for the marketing contact form — that path
// uses Zoho SMTP via nodemailer (see /api/contact/route.ts) so the
// platform's transactional sender reputation stays isolated from
// the human-facing mailbox.
// ============================================================

export interface EmailMessage {
  /** Single recipient or list. Adapters fan out per-recipient if needed. */
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  /** Override the configured default sender. Stays in adapter's allowed
   *  identities — Resend rejects non-verified senders at the API. */
  from?: string;
  replyTo?: string;
  /** Headers passed through verbatim where the adapter supports them. */
  headers?: Record<string, string>;
  /** Adapter-specific tagging (e.g. Resend tags for delivery filters). */
  tags?: Record<string, string>;
}

export interface EmailSendResult {
  /** Provider-assigned id (Resend message id, SES MessageId, etc).
   *  Empty string for the console adapter. */
  id: string;
}

export interface EmailPort {
  send(message: EmailMessage): Promise<EmailSendResult>;
}
