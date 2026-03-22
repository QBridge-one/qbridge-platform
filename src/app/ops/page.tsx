import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OpsHomePage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ops overview</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          QBridge internal console: platform AccessManager, issuer review, and risk monitoring. Issuers use{" "}
          <span className="font-medium text-foreground">Workspace</span> separately.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            Replace this hub with live metrics, queues, and alerts wired to your backend.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
