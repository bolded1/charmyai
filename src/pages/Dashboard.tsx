import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Receipt, AlertCircle, Upload as UploadIcon, Loader2, Camera } from "lucide-react";
import { useDocuments, useExpenseRecords, useUploadDocument } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent-foreground))",
  "hsl(220, 70%, 55%)",
  "hsl(150, 60%, 45%)",
  "hsl(35, 80%, 55%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 65%, 55%)",
  "hsl(180, 50%, 45%)",
  "hsl(60, 70%, 45%)",
  "hsl(310, 50%, 50%)",
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

  const isLoading = docsLoading || expLoading;


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Quick Upload Section ── */}
        {/* Upload Area */}
        <Card>
          <CardContent className="p-0">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                dragOver ? "border-primary bg-accent" : "border-border"
              }`}
              onClick={() => document.getElementById("dashboard-file-input")?.click()}
            >
              <UploadIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Drop documents here</h3>
              <p className="text-sm text-muted-foreground mb-2">or click to browse files</p>
              <p className="text-xs text-muted-foreground">Supports PDF, PNG, JPG up to 20MB</p>
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

        {/* Scan Document - tablet/mobile only */}
        <Card className="block lg:hidden">
          <CardContent className="p-0">
            <div
              className="border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer border-border hover:border-primary hover:bg-accent"
              onClick={() => document.getElementById("dashboard-camera-input")?.click()}
            >
              <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Scan Document</h3>
              <p className="text-sm text-muted-foreground mb-2">Use your camera to capture</p>
              <p className="text-xs text-muted-foreground">Takes a photo and processes it automatically</p>
              <input
                id="dashboard-camera-input"
                type="file"
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
              />
            </div>
          </CardContent>
        </Card>

      {/* ── Analytics Section ── */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Analytics</h4>
        {currencies.length === 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-12">No expense data yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-5 ${currencies.length > 1 ? "lg:grid-cols-2" : "grid-cols-1"}`}>
            {currencies.map((cur) => {
              const data = categoryDataByCurrency[cur] || [];
              const symbol = cur === "EUR" ? "€" : cur === "USD" ? "$" : cur + " ";
              return (
                <Card key={cur}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Expenses by Category ({cur})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-12">No data.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            nameKey="name"
                            stroke="none"
                          >
                            {data.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                            contentStyle={{
                              backgroundColor: "hsl(var(--popover))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              color: "hsl(var(--popover-foreground))",
                              fontSize: "13px",
                            }}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) => (
                              <span style={{ color: "hsl(var(--foreground))", fontSize: "12px" }}>{value}</span>
                            )}
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
    </div>
  );
}
