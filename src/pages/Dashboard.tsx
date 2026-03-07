import { dashboardStats, mockDocuments, mockAuditLog } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Receipt, TrendingUp, AlertCircle, DollarSign } from "lucide-react";

const stats = [
  { label: "Documents Uploaded", value: dashboardStats.documentsUploaded, icon: FileText, change: "+12 this week" },
  { label: "Expenses This Month", value: `€${dashboardStats.expensesThisMonth.toLocaleString()}`, icon: Receipt, change: "+€1,234" },
  { label: "Income Invoices", value: `€${dashboardStats.incomeInvoices.toLocaleString()}`, icon: TrendingUp, change: "+€5,000" },
  { label: "Awaiting Review", value: dashboardStats.awaitingReview, icon: AlertCircle, change: "2 urgent" },
];

const statusColors: Record<string, string> = {
  processing: "bg-muted text-muted-foreground",
  needs_review: "bg-accent text-accent-foreground",
  approved: "bg-primary/10 text-primary",
  exported: "bg-secondary text-secondary-foreground",
};

export default function DashboardPage() {
  const recentDocs = mockDocuments.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-accent-foreground" />
                </div>
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{s.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">{doc.supplier || doc.customer || 'Processing...'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {doc.totalAmount > 0 && <span className="text-sm font-medium">{doc.currency} {doc.totalAmount.toFixed(2)}</span>}
                    <Badge variant="secondary" className={statusColors[doc.status]}>
                      {doc.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAuditLog.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p className="text-sm">{entry.action}</p>
                    <p className="text-xs text-muted-foreground">{entry.user} · {new Date(entry.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
