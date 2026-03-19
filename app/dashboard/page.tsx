import type { Metadata } from "next";
import { Nav } from "@/components/landing/nav";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard — QBridge",
  description: "Your compliant digital asset infrastructure dashboard.",
};

export default function DashboardPage() {
  return (
    <>
      <Nav />
      <DashboardContent />
    </>
  );
}
