"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PlatformRole, TeamInvitePayload } from "@/types/team";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface InviteBarProps {
  onInvite: (payload: TeamInvitePayload) => Promise<void>;
  disabled?: boolean;
}

export function InviteBar({ onInvite, disabled }: InviteBarProps) {
  const [email, setEmail] = useState("");
  const [platformRole, setPlatformRole] = useState<PlatformRole>("member");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || disabled || submitting) return;
    if (!EMAIL_RE.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onInvite({ email: trimmed, platformRole });
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="grid min-w-0 flex-1 gap-2">
          <Label htmlFor="team-invite-email" className="sr-only">
            Email
          </Label>
          <Input
            id="team-invite-email"
            type="email"
            autoComplete="email"
            placeholder="Email address…"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            disabled={disabled || submitting}
            className="h-9"
          />
        </div>
        <div className="grid w-full gap-2 sm:w-40">
          <Label htmlFor="team-invite-platform-role" className="sr-only">
            Platform role
          </Label>
          <Select
            value={platformRole}
            onValueChange={(v) => setPlatformRole(v as PlatformRole)}
            disabled={disabled || submitting}
          >
            <SelectTrigger id="team-invite-platform-role" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="h-9 shrink-0" disabled={disabled || submitting || !email.trim()}>
          {submitting ? "Sending…" : "Send invite"}
        </Button>
      </form>
    </div>
  );
}
