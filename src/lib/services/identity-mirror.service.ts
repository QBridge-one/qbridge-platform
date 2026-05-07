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
import { auditLogAdapter } from "../container.server";
import { memoryOrganizationStore } from "../adapters/organization/memory.store";

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
