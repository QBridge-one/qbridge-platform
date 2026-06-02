// ============================================================
// lib/services/identity-mirror.service.ts
// Mirrors IdP-side state into our app store (today: memory store,
// tomorrow: Postgres). The route handler verifies the webhook,
// then dispatches the AuthEvent here.
//
// Idempotency: each event has eventId. We dedupe with a small set.
// Replace with a DB unique constraint when we move off memory.
// ============================================================

import "server-only";

import type { AppRole, AuthEvent } from "../core/identity.types";
import { isAppRole } from "../core/identity.types";
import {
  auditLogAdapter,
  emailAdapter,
  notificationAdapter,
  OPS_ORG_ID,
  organizationAdapter,
} from "../container.server";
import { memoryOrganizationStore } from "../adapters/organization/memory.store";
import {
  issuerKybApplicationFromMetadata,
  issuerKybReviewFromMetadata,
  parseIssuerKybStatusField,
} from "../core/issuer-kyb";
import { dispatchNotification } from "./notification.service";

const seenEventIds = new Set<string>();
const MAX_DEDUPE = 1000;

function rememberEventId(id: string) {
  seenEventIds.add(id);
  if (seenEventIds.size > MAX_DEDUPE) {
    // Drop oldest by recreating the set (cheap in JS; replace in DB later).
    const arr = [...seenEventIds].slice(-MAX_DEDUPE / 2);
    seenEventIds.clear();
    arr.forEach((v) => seenEventIds.add(v));
  }
}

interface UserPayload {
  id: string;
  email_addresses?: Array<{ email_address: string }>;
  primary_email_address_id?: string;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  public_metadata?: Record<string, unknown>;
  created_at?: number;
}

interface OrgPayload {
  id: string;
  name: string;
  slug?: string | null;
  public_metadata?: { kind?: "ops" | "issuer"; issuerId?: string | null };
  created_at?: number;
}

interface MembershipPayload {
  organization?: OrgPayload;
  public_user_data?: { user_id?: string; identifier?: string };
  role?: string;
  public_metadata?: Record<string, unknown>;
}

function pickEmail(p: UserPayload): string {
  const list = p.email_addresses ?? [];
  return list[0]?.email_address ?? "";
}

export async function applyAuthEvent(evt: AuthEvent): Promise<void> {
  if (seenEventIds.has(evt.eventId)) return;
  rememberEventId(evt.eventId);

  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      const p = evt.payload as UserPayload;
      memoryOrganizationStore.upsertUser({
        id: p.id,
        authUserId: p.id,
        email: pickEmail(p),
        displayName: [p.first_name, p.last_name].filter(Boolean).join(" ") || null,
        imageUrl: p.image_url ?? null,
        primaryWallet: (p.public_metadata?.primaryWallet as `0x${string}` | undefined) ?? null,
        createdAt: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
      });
      break;
    }
    case "user.deleted": {
      // Soft-handle: leave user record so audit history references stay valid.
      const p = evt.payload as { id: string };
      const u = memoryOrganizationStore.getUser(p.id);
      if (u) memoryOrganizationStore.upsertUser({ ...u, displayName: `${u.displayName ?? u.email} (deleted)` });
      break;
    }
    case "membership.created":
    case "membership.updated": {
      const m = evt.payload as MembershipPayload;
      const orgId = m.organization?.id;
      const userId = m.public_user_data?.user_id;
      if (!orgId || !userId) break;
      // Make sure org exists in our store.
      if (!memoryOrganizationStore.getOrg(orgId) && m.organization) {
        memoryOrganizationStore.createOrg({
          name: m.organization.name,
          slug: m.organization.slug ?? undefined,
          kind: m.organization.public_metadata?.kind ?? "issuer",
          issuerId: m.organization.public_metadata?.issuerId ?? null,
          creatorUserId: userId,
        });
      }
      const role = (m.role ?? "org:member").toLowerCase();
      const kind = memoryOrganizationStore.getOrg(orgId)?.kind ?? "issuer";
      const baseline: AppRole = role.endsWith("admin")
        ? kind === "ops"
          ? "ops_admin"
          : "issuer_admin"
        : kind === "ops"
          ? "ops_member"
          : "issuer_member";
      // Prefer granular appRoles from membership metadata when present.
      const meta = m.public_metadata;
      let appRoles: AppRole[] = [baseline];
      if (meta && typeof meta === "object") {
        const v = (meta as { appRoles?: unknown }).appRoles;
        if (Array.isArray(v)) {
          const valid = v.filter(isAppRole);
          if (valid.length > 0) appRoles = Array.from(new Set(valid));
        } else if (isAppRole((meta as { appRole?: unknown }).appRole)) {
          appRoles = [(meta as { appRole: AppRole }).appRole];
        }
      }
      memoryOrganizationStore.upsertMember(orgId, userId, appRoles, "active");
      break;
    }
    case "membership.deleted": {
      const m = evt.payload as MembershipPayload;
      const orgId = m.organization?.id;
      const userId = m.public_user_data?.user_id;
      if (orgId && userId) memoryOrganizationStore.removeMember(orgId, userId);
      break;
    }
    case "org.created":
    case "org.updated": {
      // Only create if missing; updates to name/slug not tracked yet in memory store.
      const o = evt.payload as OrgPayload;
      if (!memoryOrganizationStore.getOrg(o.id)) {
        memoryOrganizationStore.createOrg({
          name: o.name,
          slug: o.slug ?? undefined,
          kind: o.public_metadata?.kind ?? "issuer",
          issuerId: o.public_metadata?.issuerId ?? null,
          creatorUserId: "system",
        });
      }
      if (evt.type === "org.updated") {
        await maybeNotifyKybTransition(o);
      }
      break;
    }
    case "invite.accepted":
    case "invite.created":
    case "invite.revoked":
    case "org.deleted":
      // Memory store currently doesn't track these from webhooks; safe no-op.
      break;
  }

  await auditLogAdapter.append({
    orgId: null,
    actorUserId: "system",
    action: "ops.action",
    target: evt.eventId,
    payload: { type: evt.type, eventId: evt.eventId },
  });
}

// ─── KYB backup: detect transitions in org.updated ─────────
// Called on every `org.updated`. Computes the issuer KYB state from
// the event payload and fires the matching notification. The
// dedupeKey is identical to what the UI-driven path uses (orgId +
// submittedAt / decidedAt), so a re-emit from the UI write that
// races with the Clerk webhook collapses into one fanout.
//
// We do NOT write a kyb.* audit row here at v1 — out-of-band
// dashboard flips remain unaudited at the kyb.* action level (the
// generic ops.action row above still records the webhook itself).
async function maybeNotifyKybTransition(o: OrgPayload): Promise<void> {
  const meta = o.public_metadata as Record<string, unknown> | undefined;
  if (!meta) return;
  if (meta.kind !== "issuer") return;

  const kybStatus = parseIssuerKybStatusField(meta.kybStatus);
  const orgName = o.name ?? o.slug ?? o.id;
  const deps = {
    notification: notificationAdapter,
    organization: organizationAdapter,
    email: emailAdapter,
  };

  if (kybStatus === "submitted") {
    const app = issuerKybApplicationFromMetadata(meta);
    if (!app || !OPS_ORG_ID) return;
    await dispatchNotification(deps, {
      kind: "issuer.kyb_submitted",
      orgId: o.id,
      payload: {
        issuerOrgId: o.id,
        issuerOrgName: orgName,
        legalEntityName: app.legalEntityName,
        jurisdiction: app.jurisdiction,
        submittedByUserId: "system",
        submittedAt: app.submittedAt,
      },
      recipients: [
        {
          orgId: OPS_ORG_ID,
          plane: "ops",
          roles: ["ops_admin", "ops_onboarding"],
        },
      ],
      dedupeKey: `${o.id}:${app.submittedAt}`,
    });
    return;
  }

  if (kybStatus === "approved" || kybStatus === "rejected") {
    const review = issuerKybReviewFromMetadata(meta);
    if (!review) return;
    await dispatchNotification(deps, {
      kind:
        kybStatus === "approved"
          ? "issuer.application_approved"
          : "issuer.application_rejected",
      orgId: o.id,
      payload:
        kybStatus === "approved"
          ? {
              issuerOrgId: o.id,
              issuerOrgName: orgName,
              decidedByUserId: review.decidedByUserId,
              decidedAt: review.decidedAt,
            }
          : {
              issuerOrgId: o.id,
              issuerOrgName: orgName,
              decidedByUserId: review.decidedByUserId,
              decidedAt: review.decidedAt,
              reason: review.reason,
            },
      recipients: [
        {
          orgId: o.id,
          plane: "issuer",
          roles: ["issuer_admin"],
        },
      ],
      // Match the dedupeKey shape decideIssuerKyb uses so this
      // backup path collapses with the in-app emit on the same
      // decision (no duplicate notifications).
      dedupeKey: `${o.id}:application_${kybStatus}:${review.decidedAt}`,
    });
  }
}
