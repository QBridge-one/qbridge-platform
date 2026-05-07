"use client";

// ============================================================
// Issuer workspace sidebar — /workspace/* only
// No QBridge ops items (those live under /ops).
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  Users,
  ShieldCheck,
  Coins,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
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
import { can, type Permission } from "@/lib/auth/permissions";
import { APP_ROLE_LABELS, type AppRole } from "@/lib/core/identity.types";

function workspaceRoleBadge(
  roles: AppRole[] | null,
  primary: AppRole | null,
): string {
  if (!roles || roles.length === 0 || !primary) return "Token RBAC (issuer)";
  if (roles.length === 1) return APP_ROLE_LABELS[primary];
  return `${APP_ROLE_LABELS[primary]} +${roles.length - 1}`;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeVariant?: "default" | "destructive" | "secondary" | "outline";
  section?: string;
  /** If set, item only renders when current appRole has this permission. */
  requires?: Permission;
}

const BASE = "/workspace";

const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: BASE,
    icon: LayoutDashboard,
    section: "main",
    requires: "workspace:view",
  },
  {
    label: "Analytics",
    href: `${BASE}/analytics`,
    icon: BarChart3,
    section: "main",
    requires: "workspace:view",
  },
  {
    label: "My Assets",
    href: `${BASE}/assets`,
    icon: FolderOpen,
    section: "assets",
    requires: "workspace:view",
  },
  {
    label: "Create Asset",
    href: `${BASE}/assets/new`,
    icon: PlusCircle,
    section: "assets",
    requires: "workspace:assets:create",
  },
  {
    label: "Token Lifecycle",
    href: `${BASE}/tokens`,
    icon: Coins,
    section: "tokens",
    requires: "workspace:view",
  },
  {
    label: "Cap Table",
    href: `${BASE}/cap-table`,
    icon: Users,
    section: "tokens",
    requires: "workspace:cap_table:view",
  },
  {
    label: "Compliance",
    href: `${BASE}/compliance`,
    icon: ShieldCheck,
    badge: 3,
    badgeVariant: "destructive",
    section: "compliance",
    requires: "workspace:view",
  },
  {
    label: "Documents",
    href: `${BASE}/documents`,
    icon: FileText,
    section: "compliance",
    requires: "workspace:view",
  },
  {
    label: "Team & access",
    href: `${BASE}/settings/team`,
    icon: Users,
    section: "settings",
    requires: "workspace:team:view",
  },
  {
    label: "Settings",
    href: `${BASE}/settings`,
    icon: Settings,
    section: "settings",
    requires: "workspace:settings:view",
  },
];

const SECTION_LABELS: Record<string, string> = {
  main: "Overview",
  assets: "Assets",
  tokens: "Token Ops",
  compliance: "Compliance",
  settings: "Settings",
};

interface WorkspaceSidebarProps {
  issuerName?: string;
  walletAddress?: string;
  /** Full role-set for this user in the active org (preferred). */
  appRoles?: AppRole[] | null;
  /** @deprecated Pass `appRoles` instead. */
  appRole?: AppRole | null;
}

export function WorkspaceSidebar({
  issuerName = "Issuer workspace",
  walletAddress,
  appRoles = null,
  appRole = null,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const effectiveRoles: AppRole[] | null =
    appRoles && appRoles.length > 0 ? appRoles : appRole ? [appRole] : null;
  const primaryRole = effectiveRoles?.[0] ?? null;

  const visibleItems = NAV_ITEMS.filter(
    (i) => !i.requires || can(effectiveRoles, i.requires),
  );

  const sections = ["main", "assets", "tokens", "compliance", "settings"];
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

  const isActive = (href: string) =>
    href === BASE ? pathname === BASE : pathname.startsWith(href);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex flex-col border-r bg-card transition-all duration-300 ease-in-out",
          collapsed ? "w-[60px]" : "w-[240px]",
        )}
        style={{ minHeight: "100vh" }}
      >
        <div className="flex h-16 items-center gap-3 border-b px-4 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-bold text-primary-foreground">Q</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Workspace
              </span>
              <span className="truncate text-sm font-semibold leading-tight">{issuerName}</span>
              {shortAddress && (
                <span className="truncate text-xs text-muted-foreground font-mono">{shortAddress}</span>
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
          {Object.entries(groupedItems).map(([section, items]) => (
            <div key={section} className="mb-1">
              {!collapsed && (
                <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {SECTION_LABELS[section]}
                </p>
              )}
              {collapsed && <Separator className="my-2 mx-2" />}

              {items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                const linkContent = (
                  <Link
                    key={item.href}
                    href={item.href}
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
                    {!collapsed && (
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

                if (collapsed) {
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

        {!collapsed && (
          <div className="px-4 pb-2">
            <Badge variant="outline" className="text-[10px] w-full justify-center">
              {workspaceRoleBadge(effectiveRoles, primaryRole)}
            </Badge>
          </div>
        )}

        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
