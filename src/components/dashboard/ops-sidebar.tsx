"use client";

// ============================================================
// QBridge internal ops sidebar — /ops/* only
// PlatformAccessManager & platform-wide tools.
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  BarChart3,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import type { PlatformRole } from "@/types/roles";
import { can, type Permission } from "@/lib/auth/permissions";
import { APP_ROLE_LABELS, type AppRole } from "@/lib/core/identity.types";
import { isNavItemActive } from "@/lib/nav/is-nav-item-active";

function opsRoleBadge(
  roles: AppRole[] | null,
  primary: AppRole | null,
  fallback: PlatformRole | null | undefined,
): string {
  if (primary && roles && roles.length > 0) {
    return roles.length === 1
      ? APP_ROLE_LABELS[primary]
      : `${APP_ROLE_LABELS[primary]} +${roles.length - 1}`;
  }
  switch (fallback) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "PLATFORM_ADMIN":
      return "Platform Admin";
    case "COMPLIANCE":
      return "Compliance";
    case "OPERATOR":
      return "Operator";
    default:
      return "Auditor";
  }
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeVariant?: "default" | "destructive" | "secondary" | "outline";
  section?: string;
  /** Off-chain RBAC gate for the dashboard nav. */
  requires?: Permission;
}

const BASE = "/ops";

const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: BASE,
    icon: LayoutDashboard,
    section: "main",
    requires: "ops:view",
  },
  {
    label: "Analytics",
    href: `${BASE}/analytics`,
    icon: BarChart3,
    section: "main",
    requires: "ops:view",
  },
  {
    label: "Issuer applications",
    href: `${BASE}/admin/issuers`,
    icon: Building2,
    badge: "NEW",
    badgeVariant: "secondary",
    section: "admin",
    requires: "ops:issuers:approve",
  },
  {
    label: "Risk flags",
    href: `${BASE}/admin/flags`,
    icon: AlertTriangle,
    badge: 7,
    badgeVariant: "destructive",
    section: "admin",
    requires: "ops:flags:edit",
  },
  {
    label: "Team & access",
    href: `${BASE}/settings/team`,
    icon: Shield,
    section: "access",
    requires: "ops:team:view",
  },
  {
    label: "Settings",
    href: `${BASE}/settings`,
    icon: Settings,
    section: "access",
    requires: "ops:settings:view",
  },
];

const SECTION_LABELS: Record<string, string> = {
  main: "Overview",
  admin: "Platform",
  access: "Access",
};

interface OpsSidebarProps {
  /**
   * @deprecated kept for compatibility with existing callers — purely
   * cosmetic. Use `appRoles` for RBAC; chain-role badge text falls back
   * to this when `appRoles` isn't supplied.
   */
  platformRole?: PlatformRole | null;
  operatorName?: string;
  walletAddress?: string;
  /** Full role-set for this user in the active org (preferred). */
  appRoles?: AppRole[] | null;
  /** @deprecated Pass `appRoles` instead. */
  appRole?: AppRole | null;
  mobile?: boolean;
  onNavigate?: () => void;
}

export function OpsSidebar({
  platformRole,
  operatorName = "QBridge Ops",
  walletAddress,
  appRoles = null,
  appRole = null,
  mobile = false,
  onNavigate,
}: OpsSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isCollapsed = mobile ? false : collapsed;

  const effectiveRoles: AppRole[] | null =
    appRoles && appRoles.length > 0 ? appRoles : appRole ? [appRole] : null;
  const primaryRole = effectiveRoles?.[0] ?? null;

  const visibleItems = NAV_ITEMS.filter(
    (i) => !i.requires || can(effectiveRoles, i.requires),
  );

  const sections = ["main", "admin", "access"];
  const groupedItems = sections.reduce<Record<string, NavItem[]>>(
    (acc, section) => {
      const items = visibleItems.filter((i) => i.section === section);
      if (items.length > 0) acc[section] = items;
      return acc;
    },
    {},
  );

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : null;

  const navHrefs = visibleItems.map((i) => i.href);

  const isActive = (href: string) =>
    isNavItemActive(href, pathname, BASE, navHrefs);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex flex-col bg-card transition-all duration-300 ease-in-out",
          mobile ? "h-full w-full border-0" : "border-r min-h-screen",
          !mobile && (isCollapsed ? "w-[60px]" : "w-[240px]"),
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b px-4 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-bold text-primary-foreground">Q</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ops
              </span>
              <span className="truncate text-sm font-semibold leading-tight">{operatorName}</span>
              {shortAddress && (
                <span className="truncate text-xs text-muted-foreground font-mono">{shortAddress}</span>
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
          {Object.entries(groupedItems).map(([section, items]) => (
            <div key={section} className="mb-1">
              {!isCollapsed && (
                <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {SECTION_LABELS[section]}
                </p>
              )}
              {isCollapsed && <Separator className="my-2 mx-2" />}

              {items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                const linkContent = (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onNavigate?.()}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all mx-2",
                      "hover:bg-accent hover:text-accent-foreground",
                      active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <Badge variant={item.badgeVariant ?? "secondary"} className="ml-auto h-5 px-1.5 text-[10px]">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" className="flex items-center gap-2">
                        {item.label}
                        {item.badge !== undefined && (
                          <Badge variant={item.badgeVariant ?? "secondary"} className="h-5 px-1.5 text-[10px]">
                            {item.badge}
                          </Badge>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return linkContent;
              })}
            </div>
          ))}
        </nav>

        {!isCollapsed && (primaryRole || platformRole) && (
          <div className="px-4 pb-2">
            <Badge variant="outline" className="text-[10px] w-full justify-center">
              {opsRoleBadge(effectiveRoles, primaryRole, platformRole)}
            </Badge>
          </div>
        )}

        {!mobile ? (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span className="text-xs">Collapse</span>
                </>
              )}
            </Button>
          </div>
        ) : null}
      </aside>
    </TooltipProvider>
  );
}
