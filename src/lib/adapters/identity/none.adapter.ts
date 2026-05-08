// ============================================================
// lib/adapters/identity/none.adapter.ts
// "No identity provider" adapter — returned when IDENTITY_PROVIDER
// is unset (or set to "none"). Always reports an unauthenticated
// session so a fresh clone with no .env lands on the marketing
// page instead of being silently logged in as the seeded dev user.
//
// To get a usable dev experience, set one of:
//   IDENTITY_PROVIDER=memory   # in-process fixture user
//   IDENTITY_PROVIDER=clerk    # real Clerk org auth
// ============================================================

import type { IdentityPort } from "../../ports/identity.port";
import type { AppSession, AppUser } from "../../core/identity.types";
import { unauthenticated } from "../../core/errors";

class NoneIdentityAdapter implements IdentityPort {
  async getSession(): Promise<AppSession | null> {
    return null;
  }

  async requireSession(): Promise<AppSession> {
    throw unauthenticated();
  }

  async getUser(_userId: string): Promise<AppUser | null> {
    return null;
  }

  async signOut(): Promise<void> {
    // No session, nothing to clear.
  }
}

export const noneIdentityAdapter = new NoneIdentityAdapter();
