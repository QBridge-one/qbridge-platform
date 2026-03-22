import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function OpsSettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Ops settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Platform-level settings. For RBAC, use{" "}
            <Link href="/ops/settings/team" className="text-primary underline-offset-4 hover:underline">
              Team & access
            </Link>
            .
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
