"use client";

// ============================================================
// Client portal sidebar — /portal/* only
// The token-holder (corporate treasury) plane. Lean by design: no issuer/ops
// nav, no product or permission gating (a holder is any authenticated user).
// ============================================================

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  ChevronLeft,
  ChevronRight,
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
import { isNavItemActive } from "@/lib/nav/is-nav-item-active";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  section: string;
}

const BASE = "/portal";

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: BASE, icon: LayoutDashboard, section: "main" },
  { label: "Payments", href: `${BASE}#move-money`, icon: ArrowLeftRight, section: "main" },
  { label: "Statements", href: `${BASE}/statements`, icon: FileText, section: "records" },
];

const SECTION_LABELS: Record<string, string> = {
  main: "Treasury",
  records: "Records",
};

interface PortalSidebarProps {
  clientName?: string;
  mobile?: boolean;
  onNavigate?: () => void;
}

export function PortalSidebar({
  clientName = "Treasury Client",
  mobile = false,
  onNavigate,
}: PortalSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isCollapsed = mobile ? false : collapsed;

  const sections = ["main", "records"];
  const groupedItems = sections.reduce<Record<string, NavItem[]>>((acc, section) => {
    const items = NAV_ITEMS.filter((i) => i.section === section);
    if (items.length > 0) acc[section] = items;
    return acc;
  }, {});

  const navHrefs = NAV_ITEMS.map((i) => i.href);
  const isActive = (href: string) => isNavItemActive(href, pathname, BASE, navHrefs);

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
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Client Portal
              </span>
              <span className="truncate text-sm font-semibold leading-tight">{clientName}</span>
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
                      "group mx-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
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
                    {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                  </Link>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                }
                return linkContent;
              })}
            </div>
          ))}
        </nav>

        {!isCollapsed && (
          <div className="px-4 pb-2">
            <Badge variant="outline" className="w-full justify-center text-[10px]">
              Tokenized deposits
            </Badge>
          </div>
        )}

        {!mobile && (
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
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  <span className="text-xs">Collapse</span>
                </>
              )}
            </Button>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
