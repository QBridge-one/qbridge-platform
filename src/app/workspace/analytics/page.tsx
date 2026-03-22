import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorkspaceAnalyticsPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
      <Card>
        <CardHeader>
          <CardTitle>Issuer analytics</CardTitle>
          <CardDescription>Asset and token metrics for your workspace — placeholder.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
