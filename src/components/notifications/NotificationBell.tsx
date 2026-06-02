"use client";

// ============================================================
// components/notifications/NotificationBell.tsx
// Header bell with unread count + dropdown feed.
//
// Polls GET /api/notifications every 30s and on tab focus. Click
// a row to mark-read + navigate; "Mark all" calls /read-all.
//
// Bridges to existing dropdown primitives so the header chrome
// stays consistent with WalletStatus + IdentityControls.
//
// Also: bell-driven page refresh. Each poll diffs incoming items
// against the IDs we've already shown; when a new notification
// arrives between ticks, we call router.refresh() so whatever
// page the user is on re-fetches its server data without needing
// a manual reload. Every notification kind is a signal that some
// piece of platform state changed — using the bell's existing
// poll cadence avoids adding a second polling stream per page.
// ============================================================

import { Bell, CheckCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Notification } from "@/lib/core/notification";

const POLL_INTERVAL_MS = 30_000;
const PAGE_LIMIT = 20;

interface FeedResponse {
  notifications: Notification[];
  unread: number;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const aborter = useRef<AbortController | null>(null);
  // Notification IDs we've already observed. New IDs between polls
  // mean fresh server-side state — trigger router.refresh().
  const seenIdsRef = useRef<Set<string>>(new Set());
  // Skip the very first poll's "everything is new" pass; the page
  // we just mounted on already reflects what's in the DB.
  const firstLoadRef = useRef(true);

  const load = useCallback(async () => {
    aborter.current?.abort();
    const ctl = new AbortController();
    aborter.current = ctl;
    setLoading(true);
    try {
      const r = await fetch(`/api/notifications?limit=${PAGE_LIMIT}`, {
        cache: "no-store",
        signal: ctl.signal,
      });
      if (!r.ok) return;
      const data = (await r.json()) as FeedResponse;
      setItems(data.notifications);
      setUnread(data.unread);

      // Diff against the IDs we've shown before. If anything is new
      // (and this isn't the initial mount), the underlying server
      // state changed — refresh the current page so its SSR data
      // catches up. Same poll, no extra request stream.
      const incomingIds = data.notifications.map((n) => n.id);
      const hasNew = incomingIds.some((id) => !seenIdsRef.current.has(id));
      incomingIds.forEach((id) => seenIdsRef.current.add(id));

      if (!firstLoadRef.current && hasNew) {
        router.refresh();
      }
      firstLoadRef.current = false;
    } catch {
      // Silent: don't surface poll failures in the header.
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Initial load + interval poll + refresh on tab focus.
  useEffect(() => {
    void load();
    const t = setInterval(load, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
      aborter.current?.abort();
    };
  }, [load]);

  // Refresh whenever the dropdown is opened so the user sees
  // current state without waiting for the next poll tick.
  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const handleItem = useCallback(
    async (n: Notification) => {
      // Optimistic mark-read for snappy UI; server is idempotent.
      if (n.readAt === null) {
        setItems((prev) =>
          prev.map((p) => (p.id === n.id ? { ...p, readAt: Date.now() } : p)),
        );
        setUnread((u) => Math.max(0, u - 1));
        void fetch(`/api/notifications/${encodeURIComponent(n.id)}`, {
          method: "POST",
        });
      }
      setOpen(false);
      if (n.actionUrl) router.push(n.actionUrl);
    },
    [router],
  );

  const handleMarkAll = useCallback(async () => {
    setItems((prev) =>
      prev.map((p) => (p.readAt === null ? { ...p, readAt: Date.now() } : p)),
    );
    setUnread(0);
    await fetch("/api/notifications/read-all", { method: "POST" });
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium leading-none text-destructive-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-medium">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "All caught up"}
            </p>
          </div>
          {items.some((n) => n.readAt === null) ? (
            <Button variant="ghost" size="sm" onClick={handleMarkAll} className="h-8 gap-1">
              <CheckCheck className="h-3.5 w-3.5" />
              <span className="text-xs">Mark all</span>
            </Button>
          ) : null}
        </div>
        <div className="max-h-[28rem] overflow-y-auto">
          {loading && items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleItem(n)}
                    className="w-full px-4 py-3 text-left hover:bg-accent focus:bg-accent focus:outline-none"
                  >
                    <div className="flex items-start gap-2">
                      {n.readAt === null ? (
                        <span className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />
                      ) : (
                        <span className="mt-1.5 inline-block h-2 w-2 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="truncate text-sm font-medium">{n.title}</p>
                        {n.body ? (
                          <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                        ) : null}
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
