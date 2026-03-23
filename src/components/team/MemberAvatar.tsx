"use client";

import { cn } from "@/lib/utils";
import type { AvatarVariant } from "@/types/team";
import { AVATAR_VARIANT_CLASS } from "@/lib/mock/team";

interface MemberAvatarProps {
  name: string;
  variant: AvatarVariant;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClass = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function MemberAvatar({ name, variant, className, size = "md" }: MemberAvatarProps) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : (parts[0]?.slice(0, 2).toUpperCase() ?? "?");

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-medium",
        sizeClass[size],
        AVATAR_VARIANT_CLASS[variant],
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
