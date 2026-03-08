import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, FileText, CheckCircle, AlertTriangle, XCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  processed: "hsl(var(--primary))",
  approved: "hsl(150, 60%, 45%)",
  exported: "hsl(210, 70%, 55%)",
  needs_review: "hsl(40, 90%, 50%)",
  processing: "hsl(200, 60%, 55%)",
  error: "hsl(0, 70%, 55%)",
};

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(150, 60%, 45%)",
  "hsl(210, 70%, 55%)",
  "hsl(40, 90%, 50%)",
  "hsl(200, 60%, 55%)",
  "hsl(0, 70%, 55%)",
];

interface DocRow {
  status: string;
  confidence_score: number | null;
  created_at: string;
  document_type: string | null;
  file_type: string;
}

export default function AdminDocumentStatsPage() {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("status, confidence_score, created_at, document_type, file_type")
        .order("created_at", { ascending: true });
      if (error) throw error;
      setDocs(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load document stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const stats = useMemo(() => {
    const total = docs.length;
    const successful = docs.filter(d => ["processed", "approved", "exported"].includes(d.status)).length;
    const failed = docs.filter(d => d.status === "error").length;
    const needsReview = docs.filter(d => d.status === "needs_review").length;
    const processing = docs.filter(d => d.status === "processing").length;

    const withConfidence = docs.filter(d => d.confidence_score != null);
    // Normalize confidence to 0-1 range (DB may store as 0-100 or 0-1)
    const normalizeConf = (score: number) => score > 1 ? score / 100 : score;
    const avgConfidence = withConfidence.length > 0
      ? withConfidence.reduce((sum, d) => sum + normalizeConf(d.confidence_score || 0), 0) / withConfidence.length
      : 0;
    const lowConfidence = withConfidence.filter(d => normalizeConf(d.confidence_score || 0) < 0.7).length;
    const highConfidence = withConfidence.filter(d => normalizeConf(d.confidence_score || 0) >= 0.9).length;

    const successRate = total > 0 ? (successful / total) * 100 : 0;
    const failureRate = total > 0 ? (failed / total) * 100 : 0;

    // Status breakdown for pie chart
    const statusCounts: Record<string, number> = {};
    docs.forEach(d => {
      statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
    });
    const statusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // Volume trend (last 6 months)
    const volumeTrend: { month: string; count: number; avgConf: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = d.toLocaleString("en", { month: "short", year: "2-digit" });

      const monthDocs = docs.filter(doc => {
        const cd = new Date(doc.created_at);
        return cd.getFullYear() === year && cd.getMonth() === month;
      });

      const monthConf = monthDocs.filter(doc => doc.confidence_score != null);
      const monthAvg = monthConf.length > 0
        ? monthConf.reduce((s, doc) => s + (doc.confidence_score || 0), 0) / monthConf.length
        : 0;

      volumeTrend.push({ month: label, count: monthDocs.length, avgConf: Math.round(monthAvg * 100) });
    }

    // Confidence distribution buckets
    const confBuckets = [
      { range: "0-50%", count: 0 },
      { range: "50-70%", count: 0 },
      { range: "70-85%", count: 0 },
      { range: "85-95%", count: 0 },
      { range: "95-100%", count: 0 },
    ];
    withConfidence.forEach(d => {
      const score = (d.confidence_score || 0) * 100;
      if (score < 50) confBuckets[0].count++;
      else if (score < 70) confBuckets[1].count++;
      else if (score < 85) confBuckets[2].count++;
      else if (score < 95) confBuckets[3].count++;
      else confBuckets[4].count++;
    });

    // Doc type breakdown
    const typeCounts: Record<string, number> = {};
    docs.forEach(d => {
      const t = d.document_type || "unknown";
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    const typeBreakdown = Object.entries(typeCounts).map(([name, value]) => ({ name: name.replace("_", " "), value }));

    return {
      total, successful, failed, needsReview, processing,
      avgConfidence, lowConfidence, highConfidence, successRate, failureRate,
      statusBreakdown, volumeTrend, confBuckets, typeBreakdown,
    };
  }, [docs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Document Processing</h2>
          <p className="text-sm text-muted-foreground">AI extraction performance and volume analytics</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDocs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={FileText} label="Total Documents" value={String(stats.total)} />
        <KPICard
          icon={CheckCircle}
          label="Success Rate"
          value={`${stats.successRate.toFixed(1)}%`}
          subtitle={`${stats.successful} successful`}
        />
        <KPICard
          icon={TrendingUp}
          label="Avg Confidence"
          value={`${(stats.avgConfidence * 100).toFixed(1)}%`}
          subtitle={`${stats.highConfidence} high · ${stats.lowConfidence} low`}
        />
        <KPICard
          icon={AlertTriangle}
          label="Needs Attention"
          value={String(stats.needsReview + stats.failed)}
          subtitle={`${stats.needsReview} review · ${stats.failed} errors`}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Volume Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={stats.volumeTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Documents"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.15)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Avg Confidence Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confidence Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={stats.volumeTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value: number) => [`${value}%`, "Avg Confidence"]} />
                <Area
                  type="monotone"
                  dataKey="avgConf"
                  name="Confidence"
                  stroke="hsl(150, 60%, 45%)"
                  fill="hsl(150, 60%, 45%, 0.15)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Status Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats.statusBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={2}
                >
                  {stats.statusBreakdown.map((entry, idx) => (
                    <Cell key={idx} fill={STATUS_COLORS[entry.name] || PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [value, name.replace("_", " ")]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {stats.statusBreakdown.map((entry, idx) => (
                <Badge key={idx} variant="secondary" className="text-[10px] capitalize gap-1">
                  <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: STATUS_COLORS[entry.name] || PIE_COLORS[idx % PIE_COLORS.length] }} />
                  {entry.name.replace("_", " ")} ({entry.value})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Confidence Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confidence Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.confBuckets}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Documents" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Document Type Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Document Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats.typeBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={2}
                >
                  {stats.typeBreakdown.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {stats.typeBreakdown.map((entry, idx) => (
                <Badge key={idx} variant="secondary" className="text-[10px] capitalize gap-1">
                  <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  {entry.name} ({entry.value})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, subtitle }: {
  icon: typeof FileText;
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
