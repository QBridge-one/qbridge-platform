// ============================================================
// lib/ports/identity.port.ts
// Identity port — who is the current user.
// Implemented by: ClerkIdentityAdapter, MemoryIdentityAdapter,
// (future) WorkOSIdentityAdapter.
// Application code only imports this interface.
// ============================================================

import type { AppSession, AppUser } from "../core/identity.types";

export interface IdentityPort {
  /** Get the current session, or null if unauthenticated. Server-only. */
  getSession(): Promise<AppSession | null>;
  /** Throws DomainError("UNAUTHENTICATED") if no session. Server-only. */
  requireSession(): Promise<AppSession>;
  /** Look up a user by internal id. */
  getUser(userId: string): Promise<AppUser | null>;
  /** Sign the current user out. May be a no-op for server adapters. */
  signOut(): Promise<void>;
}
