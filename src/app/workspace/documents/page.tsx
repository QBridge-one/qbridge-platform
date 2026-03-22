import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorkspaceDocumentsPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
      <Card>
        <CardHeader>
          <CardTitle>Document vault</CardTitle>
          <CardDescription>Offering docs, SPVs, and compliance files — placeholder.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
