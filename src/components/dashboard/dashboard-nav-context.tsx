"use client";

import { createContext, useContext } from "react";

const DashboardNavContext = createContext<{ openNav: () => void } | null>(null);

export function DashboardNavProvider({
  openNav,
  children,
}: {
  openNav: () => void;
  children: React.ReactNode;
}) {
  return (
    <DashboardNavContext.Provider value={{ openNav }}>
      {children}
    </DashboardNavContext.Provider>
  );
}

export function useDashboardNav() {
  return useContext(DashboardNavContext);
}
