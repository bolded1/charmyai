import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Receipt, TrendingUp, ArrowRight, CheckCircle2, Clock, Eye } from "lucide-react";
import { useDocuments, useExpenseRecords, useIncomeRecords } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: documents = [], isLoading: docsLoading } = useDocuments();
  const { data: expenses = [], isLoading: expLoading } = useExpenseRecords();
  const { data: income = [], isLoading: incLoading } = useIncomeRecords();
  const navigate = useNavigate();

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">Please log in to view dashboard.</div>;
  }

  if (docsLoading || expLoading || incLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const processing = documents.filter((d) => d.status === "processing").length;
  const needsReview = documents.filter((d) => d.status === "processed" || d.status === "needs_review").length;
  const approved = documents.filter((d) => d.status === "approved").length;
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.total_amount || 0), 0);
  const totalIncome = income.reduce((s, e) => s + Number(e.total_amount || 0), 0);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Workflow Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/app/upload")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-semibold">{documents.length}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/app/upload")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Processing</span>
            </div>
            <p className="text-2xl font-semibold">{processing}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/app/documents")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Review</span>
            </div>
            <p className="text-2xl font-semibold">{needsReview}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/app/expenses")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Approved</span>
            </div>
            <p className="text-2xl font-semibold">{approved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Expenses</span>
              </div>
              <p className="text-xl font-semibold">€{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/app/expenses")}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Income</span>
              </div>
              <p className="text-xl font-semibold">€{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/app/income")}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Upload CTA */}
      <Card className="border-dashed cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/app/upload")}>
        <CardContent className="p-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">Upload Documents</p>
          <p className="text-xs text-muted-foreground">Go to the capture workspace to upload or scan documents</p>
        </CardContent>
      </Card>
    </div>
  );
}
