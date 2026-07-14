// ============================================================
// app/portal/statements/page.tsx — Client portal statements (static)
// A holder's monthly deposit-token statements. Illustrative for now — wires to
// real settlement data once the deposit cluster is live.
// ============================================================

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download } from "lucide-react";

export const metadata = { title: "Statements" };

const STATEMENTS = [
  { period: "June 2026", opening: "CA$ 6,400,000.00", closing: "CA$ 8,000,000.00", payments: 14 },
  { period: "May 2026", opening: "CA$ 5,100,000.00", closing: "CA$ 6,400,000.00", payments: 9 },
  { period: "April 2026", opening: "CA$ 4,750,000.00", closing: "CA$ 5,100,000.00", payments: 11 },
  { period: "March 2026", opening: "CA$ 2,000,000.00", closing: "CA$ 4,750,000.00", payments: 7 },
];

export default function StatementsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statements</h1>
          <p className="text-sm text-muted-foreground">
            Monthly statements for your tokenized deposit account.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">Illustrative</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Blockchain Deposit Account · CAD</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul>
            {STATEMENTS.map((s) => (
              <li
                key={s.period}
                className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.period}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.payments} payments · {s.opening} → {s.closing}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  PDF
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Statement figures are illustrative until the deposit cluster and settlement adapter are wired.
      </p>
    </div>
  );
}
