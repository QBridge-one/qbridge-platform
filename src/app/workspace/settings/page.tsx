import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function WorkspaceSettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>
            Issuer preferences and integrations. Token roles live under{" "}
            <Link href="/workspace/settings/team" className="text-primary underline-offset-4 hover:underline">
              Team & access
            </Link>
            .
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
