// ============================================================
// lib/services/notification.service.ts
// Renders + fans out platform notifications.
//
// Two entry points:
//   - dispatchNotification(...)  — called from a state-changing
//     service (e.g. onboarding) to enqueue in-app rows + email
//     outbox rows for everyone matching a RecipientRule.
//   - drainEmailOutbox(...)      — invoked by a poller / cron;
//     leases pending email rows and calls EmailPort.send().
//
// Recipient resolution: we union members across all rules, filter
// by appRoles intersection, dedupe by user id, drop members without
// an email. The same notification is written once per recipient
// (denormalized fanout — bell queries are a single index hit).
//
// Idempotency: caller supplies `dedupeKey` (e.g. the orgId + a
// stable event tag like `"kyb_approved"`); the port's partial-unique
// index coalesces repeated emits across the UI + webhook paths.
// ============================================================

import "server-only";

import type {
  NewNotification,
  NotificationKind,
  NotificationPayloads,
  RecipientRule,
} from "../core/notification";
import type { OrganizationPort } from "../ports/organization.port";
import type { NotificationPort } from "../ports/notification.port";
import type { EmailPort } from "../ports/email.port";

export interface NotificationServiceDeps {
  notification: NotificationPort;
  organization: OrganizationPort;
  email: EmailPort;
}

export interface DispatchInput<K extends NotificationKind> {
  kind: K;
  payload: NotificationPayloads[K];
  /** Org this notification is ABOUT (issuer org for kyb.*). */
  orgId: string;
  /** Who should receive this. Each rule is resolved independently
   *  via OrganizationPort.listMembers; final recipient set is the
   *  union, deduped by user id. */
  recipients: RecipientRule[];
  /** When set, repeated calls with the same (kind, orgId, userId,
   *  dedupeKey) tuple are no-ops at the DB level. Set this for any
   *  emit that could be triggered by more than one path (UI +
   *  webhook backup). */
  dedupeKey?: string | null;
}

export interface DispatchResult {
  inserted: number;
  emailsEnqueued: number;
  skippedNoEmail: number;
}

// ─── Renderers: kind → title/body/html ─────────────────────
// Plain template strings for v1. When templates grow, swap to
// react-email or MJML behind an EmailRendererPort.

type Renderer<K extends NotificationKind> = (payload: NotificationPayloads[K]) => {
  title: string;
  body: string;
  actionUrl: string | null;
  subject: string;
  html: string;
  text: string;
};

const renderers: { [K in NotificationKind]: Renderer<K> } = {
  "issuer.kyb_submitted": (p) => {
    const title = `New KYB submission: ${p.issuerOrgName}`;
    const body = `${p.legalEntityName} (${p.jurisdiction}) submitted KYB and is awaiting review.`;
    // Queue is a single page; ?focus= tells the client to auto-open
    // the review drawer for this org on landing.
    const actionUrl = `/ops/admin/issuers?focus=${encodeURIComponent(p.issuerOrgId)}`;
    return {
      title,
      body,
      actionUrl,
      subject: title,
      html: `
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(body)}</p>
        <p><a href="${escapeAttr(actionUrl)}">Review in QBridge ops</a></p>
      `,
      text: `${title}\n\n${body}\n\nReview: ${actionUrl}`,
    };
  },
  "issuer.kyb_approved": (p) => {
    const title = `KYB approved for ${p.issuerOrgName}`;
    const body = `Your KYB application has been approved. Your workspace is now active.`;
    const actionUrl = `/workspace`;
    return {
      title,
      body,
      actionUrl,
      subject: title,
      html: `
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(body)}</p>
        <p><a href="${escapeAttr(actionUrl)}">Open your workspace</a></p>
      `,
      text: `${title}\n\n${body}\n\nOpen: ${actionUrl}`,
    };
  },
  "issuer.kyb_rejected": (p) => {
    const title = `KYB rejected for ${p.issuerOrgName}`;
    const reasonLine = p.reason
      ? `Reason: ${p.reason}`
      : `Please contact QBridge support for details.`;
    const body = `Your KYB application was not approved. ${reasonLine}`;
    const actionUrl = `/onboarding/kyb`;
    return {
      title,
      body,
      actionUrl,
      subject: title,
      html: `
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(`Your KYB application was not approved.`)}</p>
        <p>${escapeHtml(reasonLine)}</p>
        <p><a href="${escapeAttr(actionUrl)}">Update and resubmit</a></p>
      `,
      text: `${title}\n\nYour KYB application was not approved.\n${reasonLine}\n\nResubmit: ${actionUrl}`,
    };
  },
};

// ─── Public API ────────────────────────────────────────────
export async function dispatchNotification<K extends NotificationKind>(
  deps: NotificationServiceDeps,
  input: DispatchInput<K>,
): Promise<DispatchResult> {
  const recipients = await resolveRecipients(deps.organization, input.recipients);
  const render = renderers[input.kind];
  const rendered = render(input.payload);

  let inserted = 0;
  let emailsEnqueued = 0;
  let skippedNoEmail = 0;

  for (const r of recipients) {
    // The renderer enforces kind ↔ payload coherence by construction;
    // the generic K parameter prevents TS from narrowing this literal
    // into a single arm of the NewNotification discriminated union.
    await deps.notification.enqueue({
      kind: input.kind,
      orgId: input.orgId,
      userId: r.userId,
      title: rendered.title,
      body: rendered.body,
      actionUrl: rendered.actionUrl,
      payload: input.payload,
      dedupeKey: input.dedupeKey ?? null,
    } as NewNotification);
    inserted += 1;

    if (!r.email) {
      skippedNoEmail += 1;
      continue;
    }
    await deps.notification.enqueueEmail({
      toAddress: r.email,
      toUserId: r.userId,
      orgId: input.orgId,
      kind: input.kind,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      dedupeKey: input.dedupeKey ?? null,
      payload: input.payload as Record<string, unknown>,
    });
    emailsEnqueued += 1;
  }

  return { inserted, emailsEnqueued, skippedNoEmail };
}

export interface DrainOptions {
  /** Max rows to lease in this pass. Default 25. */
  batchSize?: number;
  /** Lease duration in ms (long enough for one HTTP send round-trip,
   *  short enough to recover if the dispatcher crashes). Default 60s. */
  leaseMs?: number;
  /** Sleep between sends to respect provider rate limits. Resend's
   *  free tier is 5 req/s; 220 ms keeps us comfortably under. Set to
   *  0 to disable (e.g. if you've upgraded to a higher tier). */
  throttleMs?: number;
}

export interface DrainResult {
  attempted: number;
  sent: number;
  failed: number;
}

/** One pass over the email outbox. Returns once the batch is drained.
 *  Call this from a cron / Vercel cron / Railway worker — see docs. */
export async function drainEmailOutbox(
  deps: Pick<NotificationServiceDeps, "notification" | "email">,
  opts?: DrainOptions,
): Promise<DrainResult> {
  const batch = await deps.notification.claimPendingEmails(
    opts?.batchSize ?? 25,
    opts?.leaseMs ?? 60_000,
  );
  const throttleMs = opts?.throttleMs ?? 220;
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < batch.length; i++) {
    const row = batch[i];
    if (i > 0 && throttleMs > 0) {
      await new Promise((r) => setTimeout(r, throttleMs));
    }
    try {
      await deps.email.send({
        to: row.toAddress,
        subject: row.subject,
        html: row.html,
        text: row.text ?? undefined,
        // Resend rejects tag values with characters outside
        // [A-Za-z0-9_-], so collapse other chars (e.g. the "." in
        // "issuer.kyb_submitted") into underscores.
        tags: {
          kind: sanitizeTag(row.kind),
          ...(row.orgId ? { orgId: sanitizeTag(row.orgId) } : {}),
        },
      });
      await deps.notification.markEmailSent(row.id);
      sent += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await deps.notification.markEmailFailed(row.id, msg);
      failed += 1;
    }
  }
  return { attempted: batch.length, sent, failed };
}

// ─── Recipient resolution ──────────────────────────────────
interface ResolvedRecipient {
  userId: string;
  email: string | null;
}

async function resolveRecipients(
  orgPort: OrganizationPort,
  rules: RecipientRule[],
): Promise<ResolvedRecipient[]> {
  const byUserId = new Map<string, ResolvedRecipient>();
  for (const rule of rules) {
    const members = await orgPort.listMembers(rule.orgId);
    for (const m of members) {
      if (m.status !== "active") continue;
      if (!m.appRoles.some((r) => rule.roles.includes(r))) continue;
      if (byUserId.has(m.userId)) continue;
      byUserId.set(m.userId, {
        userId: m.userId,
        email: m.email && m.email.length > 0 ? m.email : null,
      });
    }
  }
  return Array.from(byUserId.values());
}

// ─── HTML escaping (no template engine dep) ────────────────
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

function sanitizeTag(s: string): string {
  return s.replace(/[^A-Za-z0-9_-]+/g, "_");
}
