import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OpsRiskFlagsPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Risk flags</h1>
      <Card>
        <CardHeader>
          <CardTitle>Platform risk</CardTitle>
          <CardDescription>Cross-tenant risk signals — placeholder.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
