"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DashboardNavProvider } from "@/components/dashboard/dashboard-nav-context";

interface DashboardShellProps {
  renderSidebar: (options: {
    mobile: boolean;
    onNavigate?: () => void;
  }) => ReactNode;
  header: ReactNode;
  children: ReactNode;
}

export function DashboardShell({
  renderSidebar,
  header,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden shrink-0 md:block">{renderSidebar({ mobile: false })}</div>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="w-[min(100%,280px)] gap-0 p-0">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          {renderSidebar({ mobile: true, onNavigate: () => setNavOpen(false) })}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardNavProvider openNav={() => setNavOpen(true)}>{header}</DashboardNavProvider>
        <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
