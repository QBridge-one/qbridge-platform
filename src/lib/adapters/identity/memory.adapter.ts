// ============================================================
// lib/adapters/identity/memory.adapter.ts
// In-memory identity adapter — used in dev / preview when no IdP
// is configured. Reads a "fake session" from a server-only header
// or an in-process default. Production must use a real adapter.
// ============================================================

import { headers } from "next/headers";
import type { IdentityPort } from "../../ports/identity.port";
import type { AppOrg, AppSession, AppUser } from "../../core/identity.types";
import { unauthenticated } from "../../core/errors";
import { memoryOrganizationStore } from "../organization/memory.store";

const DEFAULT_DEV_USER: AppUser = {
  id: "user_dev_root",
  authUserId: "memory:user_dev_root",
  email: "dev@qbridge.local",
  displayName: "QBridge Dev",
  imageUrl: null,
  primaryWallet: null,
  createdAt: new Date(0).toISOString(),
};

class MemoryIdentityAdapter implements IdentityPort {
  /** Override session in tests / previews via header `x-qbridge-dev-user`. */
  private async resolveSessionUser(): Promise<AppUser> {
    try {
      const h = await headers();
      const override = h.get("x-qbridge-dev-user");
      if (override) {
        return {
          ...DEFAULT_DEV_USER,
          id: override,
          authUserId: `memory:${override}`,
          email: `${override}@qbridge.local`,
          displayName: override,
        };
      }
    } catch {
      // headers() throws outside a request — fall through to default.
    }
    return DEFAULT_DEV_USER;
  }

  /** Pick active org based on the route plane (set by middleware). */
  private async resolveActiveOrg(userId: string): Promise<AppOrg | null> {
    const orgs = memoryOrganizationStore.listForUser(userId);
    if (orgs.length === 0) return null;
    let plane: "ops" | "issuer" | null = null;
    try {
      const h = await headers();
      const v = h.get("x-qbridge-plane");
      if (v === "ops" || v === "issuer") plane = v;
    } catch {
      // headers() unavailable outside a request — fall through.
    }
    if (plane) {
      const match = orgs.find((o) => o.kind === plane);
      if (match) return match;
    }
    return orgs[0];
  }

  async getSession(): Promise<AppSession | null> {
    const user = await this.resolveSessionUser();
    memoryOrganizationStore.upsertUser(user);
    const activeOrg = await this.resolveActiveOrg(user.id);
    const appRole = activeOrg
      ? memoryOrganizationStore.roleOf(activeOrg.id, user.id)
      : null;
    return { user, activeOrg, appRole };
  }

  async requireSession(): Promise<AppSession> {
    const s = await this.getSession();
    if (!s) throw unauthenticated();
    return s;
  }

  async getUser(userId: string): Promise<AppUser | null> {
    return memoryOrganizationStore.getUser(userId);
  }

  async signOut(): Promise<void> {
    // Memory adapter has no real sessions to clear.
  }
}

export const memoryIdentityAdapter = new MemoryIdentityAdapter();
