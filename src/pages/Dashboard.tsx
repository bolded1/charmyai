import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload as UploadIcon, Loader2, Camera } from "lucide-react";
import { useDocuments, useExpenseRecords, useUploadDocument } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(220, 55%, 52%)",
  "hsl(150, 45%, 42%)",
  "hsl(35, 65%, 50%)",
  "hsl(280, 45%, 50%)",
  "hsl(0, 50%, 50%)",
  "hsl(180, 40%, 42%)",
  "hsl(60, 55%, 42%)",
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: documents = [], isLoading: docsLoading } = useDocuments();
  const { data: expenses = [], isLoading: expLoading } = useExpenseRecords();
  const uploadMutation = useUploadDocument();
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!user) { navigate("/login"); return; }
    Array.from(e.dataTransfer.files).forEach((file) => uploadMutation.mutate(file));
  }, [user, uploadMutation, navigate]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) { navigate("/login"); return; }
    Array.from(e.target.files || []).forEach((file) => uploadMutation.mutate(file));
    e.target.value = "";
  }, [user, uploadMutation, navigate]);

  const currencies = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => set.add(e.currency || "EUR"));
    return Array.from(set).sort();
  }, [expenses]);

  const categoryDataByCurrency = useMemo(() => {
    const result: Record<string, { name: string; value: number }[]> = {};
    currencies.forEach((cur) => {
      const map: Record<string, number> = {};
      expenses
        .filter((e) => (e.currency || "EUR") === cur)
        .forEach((e) => {
          const cat = e.category || "Uncategorized";
          map[cat] = (map[cat] || 0) + Number(e.total_amount || 0);
        });
      result[cur] = Object.entries(map)
        .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
        .sort((a, b) => b.value - a.value);
    });
    return result;
  }, [expenses, currencies]);

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">Please log in to view dashboard.</div>;
  }

  if (docsLoading || expLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.total_amount || 0), 0);

  return (
    <div className="max-w-5xl space-y-8">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Documents</p>
            <p className="text-2xl font-semibold">{documents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Expenses</p>
            <p className="text-2xl font-semibold">{expenses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
            <p className="text-2xl font-semibold">€{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload */}
      <Card>
        <CardContent className="p-0">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
              dragOver ? "border-primary bg-brand-soft" : "border-border"
            }`}
            onClick={() => document.getElementById("dashboard-file-input")?.click()}
          >
            <UploadIcon className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Drop documents here or click to browse</p>
            <p className="text-xs text-muted-foreground">PDF, PNG, JPG up to 20MB</p>
            <input
              id="dashboard-file-input"
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
            />
          </div>
        </CardContent>
      </Card>

      {/* Scan - mobile */}
      <Card className="block lg:hidden">
        <CardContent className="p-0">
          <div
            className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer border-border hover:border-primary hover:bg-brand-soft transition-colors"
            onClick={() => document.getElementById("dashboard-camera-input")?.click()}
          >
            <Camera className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Scan document</p>
            <p className="text-xs text-muted-foreground">Use your camera to capture</p>
            <input id="dashboard-camera-input" type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFileSelect} />
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      {currencies.length > 0 && (
        <div className={`grid gap-5 ${currencies.length > 1 ? "lg:grid-cols-2" : "grid-cols-1"}`}>
          {currencies.map((cur) => {
            const data = categoryDataByCurrency[cur] || [];
            const symbol = cur === "EUR" ? "€" : cur === "USD" ? "$" : cur + " ";
            return (
              <Card key={cur}>
                <CardHeader>
                  <CardTitle>Expenses by Category ({cur})</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-12">No data.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value" nameKey="name" stroke="none">
                          {data.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                            color: "hsl(var(--popover-foreground))",
                            fontSize: "13px",
                          }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={7}
                          formatter={(value) => <span style={{ color: "hsl(var(--foreground))", fontSize: "12px" }}>{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
